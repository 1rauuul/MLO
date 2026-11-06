import { ConfigError, HttpError, ParseError, type HttpClient } from '@/shared/services/http/client';
import { isNumber, isRecord, isString } from '@/shared/utils/validate';

/** Mismo formato que produce el CMS: 32 bytes aleatorios en base64url. */
const INVITATION_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const STUDENT_KEY_HEADER = 'X-MLO-Student-Key';

export type InvitationError =
  | 'invalid'
  | 'expired'
  | 'used'
  | 'revoked'
  | 'full'
  | 'already_member'
  | 'config'
  | 'network';

const ERROR_CODES: readonly InvitationError[] = [
  'invalid',
  'expired',
  'used',
  'revoked',
  'full',
  'already_member',
];

export interface InvitationMembership {
  studentId: string;
  classId: string;
  classCode: string;
  className: string;
  teacherName: string;
  courseId: string;
  courseCatalogId: string;
  joinedAt: string;
}

export interface InvitationClaim {
  membership: InvitationMembership;
  published: { version: number; hash: string; publishedAt: string } | null;
}

function fail(message: string): never {
  throw new ParseError(`Respuesta de invitación inválida: ${message}`);
}

function nonEmpty(value: unknown, field: string): string {
  if (!isString(value) || value.trim().length === 0) {
    fail(field);
  }
  return value;
}

function parseMembership(value: unknown): InvitationMembership {
  if (!isRecord(value)) {
    fail('membresía');
  }
  return {
    studentId: nonEmpty(value.studentId, 'studentId'),
    classId: nonEmpty(value.classId, 'classId'),
    classCode: nonEmpty(value.classCode, 'classCode'),
    className: nonEmpty(value.className, 'className'),
    teacherName: nonEmpty(value.teacherName, 'teacherName'),
    courseId: nonEmpty(value.courseId, 'courseId'),
    courseCatalogId: nonEmpty(value.courseCatalogId, 'courseCatalogId'),
    joinedAt: nonEmpty(value.joinedAt, 'joinedAt'),
  };
}

function parsePublished(value: unknown): InvitationClaim['published'] {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    !isRecord(value) ||
    !isNumber(value.version) ||
    !Number.isInteger(value.version) ||
    value.version <= 0 ||
    !isString(value.hash) ||
    value.hash.trim().length === 0 ||
    !isString(value.publishedAt)
  ) {
    fail('publicación');
  }
  return { version: value.version, hash: value.hash, publishedAt: value.publishedAt };
}

export function parseInvitationClaim(value: unknown): InvitationClaim {
  if (!isRecord(value) || value.ok !== true) {
    fail('ok');
  }
  return {
    membership: parseMembership(value.membership),
    published: parsePublished(value.published),
  };
}

/**
 * El alumno puede pegar el enlace real del deep link o el token suelto. El
 * código de clase de 6 caracteres no es un token y sigue su flujo aparte.
 */
export function extractInvitationToken(raw: string): string | null {
  const text = raw.trim();
  if (!text) {
    return null;
  }
  let candidate = text;
  const match = /[?&]token=([^&#\s]+)/.exec(text);
  if (match) {
    try {
      candidate = decodeURIComponent(match[1]!);
    } catch {
      return null;
    }
  }
  return INVITATION_TOKEN.test(candidate) ? candidate : null;
}

/** Clasifica el error HTTP estable del CMS sin exponer token ni hash. */
export function isInvitationError(error: unknown): InvitationError {
  if (error instanceof ConfigError) {
    return 'config';
  }
  if (error instanceof ParseError) {
    return 'invalid';
  }
  if (error instanceof HttpError) {
    try {
      const body: unknown = JSON.parse(error.body);
      if (isRecord(body) && isString(body.error)) {
        const code = body.error;
        if ((ERROR_CODES as readonly string[]).includes(code)) {
          return code as InvitationError;
        }
      }
    } catch {
      // Cuerpo ausente o ilegible: se usa el estado HTTP.
    }
    if (error.status === 400) {
      return 'invalid';
    }
    if (error.status === 410) {
      return 'expired';
    }
    if (error.status === 409) {
      return 'used';
    }
  }
  return 'network';
}

export function claimInvitationRequest(
  client: HttpClient,
  token: string,
  studentKey: string,
  studentName: string,
): Promise<InvitationClaim> {
  return client
    .post<unknown>(
      '/invitations/claim',
      { token, studentName },
      { headers: { [STUDENT_KEY_HEADER]: studentKey } },
    )
    .then(parseInvitationClaim);
}
