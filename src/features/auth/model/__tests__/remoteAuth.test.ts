import {
  HttpError,
  NetworkError,
  httpAuth,
  httpRecovery,
} from '@/shared/services/http/client';
import {
  confirmPasswordReset,
  linkRemote,
  loginRemote,
  logoutRemote,
  registerRemote,
  requestPasswordReset,
  updateEmailRemote,
} from '@/features/auth/model/remoteAuth';

jest.mock('@/shared/services/http/client', () => {
  const actual = jest.requireActual('@/shared/services/http/client');
  return {
    ...actual,
    httpAuth: { post: jest.fn(), put: jest.fn() },
    httpRecovery: { post: jest.fn() },
  };
});

const post = httpAuth.post as jest.Mock;
const put = httpAuth.put as jest.Mock;
const recoveryPost = httpRecovery.post as jest.Mock;

const response = {
  token: 'tok',
  student: {
    externalKey: '11111111-1111-4111-8111-111111111111',
    username: 'valentina',
    displayName: 'Valentina Ríos',
    email: 'valentina@escuela.mx',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('remoteAuth', () => {
  it('registra y parsea la sesión', async () => {
    post.mockResolvedValue(response);
    await expect(
      registerRemote({
        username: 'valentina',
        password: 'Secreto1!',
        displayName: 'Valentina Ríos',
        email: 'valentina@escuela.mx',
      }),
    ).resolves.toEqual({ ok: true, result: response });
    expect(post).toHaveBeenCalledWith('/auth/register', {
      username: 'valentina',
      password: 'Secreto1!',
      displayName: 'Valentina Ríos',
      email: 'valentina@escuela.mx',
    });
  });

  it('acepta cuentas viejas sin correo', async () => {
    post.mockResolvedValue({
      ...response,
      student: { ...response.student, email: null },
    });
    await expect(loginRemote('valentina', 'Secreto1!')).resolves.toEqual({
      ok: true,
      result: {
        ...response,
        student: { ...response.student, email: null },
      },
    });
  });

  it('entra con usuario y contraseña', async () => {
    post.mockResolvedValue(response);
    await expect(loginRemote('valentina', 'Secreto1!')).resolves.toEqual({
      ok: true,
      result: response,
    });
  });

  it('mapea credenciales inválidas y límite de intentos', async () => {
    post.mockRejectedValueOnce(new HttpError(401, ''));
    await expect(loginRemote('valentina', 'mala')).resolves.toEqual({
      ok: false,
      error: 'invalid_credentials',
    });

    post.mockRejectedValueOnce(new HttpError(429, ''));
    await expect(loginRemote('valentina', 'mala')).resolves.toEqual({
      ok: false,
      error: 'rate_limited',
    });
  });

  it('distingue usuario, correo e identidad ya registrada', async () => {
    post.mockRejectedValueOnce(
      new HttpError(409, JSON.stringify({ error: 'username_taken' })),
    );
    await expect(registerRemote(input())).resolves.toEqual({
      ok: false,
      error: 'username_taken',
    });

    post.mockRejectedValueOnce(
      new HttpError(409, JSON.stringify({ error: 'email_taken' })),
    );
    await expect(registerRemote(input())).resolves.toEqual({
      ok: false,
      error: 'email_taken',
    });

    post.mockRejectedValueOnce(
      new HttpError(409, JSON.stringify({ error: 'already_registered' })),
    );
    await expect(registerRemote(input())).resolves.toEqual({
      ok: false,
      error: 'already_registered',
    });
  });

  it('distingue un correo inválido del servidor', async () => {
    post.mockRejectedValueOnce(
      new HttpError(400, JSON.stringify({ error: 'email_invalid' })),
    );
    await expect(registerRemote(input())).resolves.toEqual({
      ok: false,
      error: 'email_invalid',
    });
  });

  it('vincula una cuenta antigua con un código', async () => {
    post.mockResolvedValue(response);
    const input = {
      externalKey: '11111111-1111-4111-8111-111111111111',
      username: 'valentina',
      password: 'Secreto1!',
      displayName: 'Valentina Ríos',
      code: '123456',
    };
    await expect(linkRemote(input)).resolves.toEqual({
      ok: true,
      result: response,
    });
    expect(post).toHaveBeenCalledWith('/auth/link', input);
  });

  it('mapea los errores de vinculación', async () => {
    post.mockRejectedValueOnce(
      new HttpError(409, JSON.stringify({ error: 'already_registered' })),
    );
    await expect(linkRemote(linkInput())).resolves.toEqual({
      ok: false,
      error: 'already_registered',
    });

    post.mockRejectedValueOnce(
      new HttpError(400, JSON.stringify({ error: 'invalid_code' })),
    );
    await expect(linkRemote(linkInput())).resolves.toEqual({
      ok: false,
      error: 'invalid_code',
    });

    post.mockRejectedValueOnce(
      new HttpError(400, JSON.stringify({ error: 'password_invalid' })),
    );
    await expect(linkRemote(linkInput())).resolves.toEqual({
      ok: false,
      error: 'password_weak',
    });

    post.mockRejectedValueOnce(
      new HttpError(409, JSON.stringify({ error: 'username_taken' })),
    );
    await expect(linkRemote(linkInput())).resolves.toEqual({
      ok: false,
      error: 'username_taken',
    });
  });

  it('mapea red y datos inválidos', async () => {
    post.mockRejectedValueOnce(new NetworkError());
    await expect(loginRemote('valentina', 'Secreto1!')).resolves.toEqual({
      ok: false,
      error: 'network_error',
    });

    post.mockResolvedValueOnce({ token: 'tok' });
    await expect(loginRemote('valentina', 'Secreto1!')).resolves.toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('el logout no rompe si no hay red', async () => {
    post.mockRejectedValueOnce(new NetworkError());
    await expect(logoutRemote()).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith('/auth/logout', {});
  });

  it('solicita el código de recuperación', async () => {
    recoveryPost.mockResolvedValue({ ok: true });
    await expect(requestPasswordReset('valentina@escuela.mx')).resolves.toEqual({
      ok: true,
    });
    expect(recoveryPost).toHaveBeenCalledWith('/auth/recover', {
      email: 'valentina@escuela.mx',
    });
  });

  it('mapea correo inválido y correo no configurado', async () => {
    recoveryPost.mockRejectedValueOnce(new HttpError(400, ''));
    await expect(requestPasswordReset('mal')).resolves.toEqual({
      ok: false,
      error: 'invalid_email',
    });

    recoveryPost.mockRejectedValueOnce(new HttpError(503, ''));
    await expect(requestPasswordReset('valentina@escuela.mx')).resolves.toEqual({
      ok: false,
      error: 'email_unavailable',
    });

    recoveryPost.mockRejectedValueOnce(new NetworkError());
    await expect(requestPasswordReset('valentina@escuela.mx')).resolves.toEqual({
      ok: false,
      error: 'network_error',
    });
  });

  it('confirma el código y la nueva contraseña', async () => {
    recoveryPost.mockResolvedValueOnce(undefined);
    await expect(
      confirmPasswordReset('valentina@escuela.mx', '123456', 'Nueva1!'),
    ).resolves.toEqual({ ok: true });
    expect(recoveryPost).toHaveBeenCalledWith('/auth/recover/verify', {
      email: 'valentina@escuela.mx',
      code: '123456',
      password: 'Nueva1!',
    });
  });

  it('mapea código inválido y contraseña débil', async () => {
    recoveryPost.mockRejectedValueOnce(
      new HttpError(400, JSON.stringify({ error: 'invalid_code' })),
    );
    await expect(
      confirmPasswordReset('valentina@escuela.mx', '000000', 'Nueva1!'),
    ).resolves.toEqual({ ok: false, error: 'invalid_code' });

    recoveryPost.mockRejectedValueOnce(
      new HttpError(400, JSON.stringify({ error: 'password_invalid' })),
    );
    await expect(
      confirmPasswordReset('valentina@escuela.mx', '123456', 'debil'),
    ).resolves.toEqual({ ok: false, error: 'password_weak' });
  });

  it('actualiza el correo de recuperación con la contraseña actual', async () => {
    put.mockResolvedValueOnce(undefined);
    await expect(
      updateEmailRemote('valentina@escuela.mx', 'Secreto1!'),
    ).resolves.toEqual({ ok: true });
    expect(put).toHaveBeenCalledWith('/students/me/email', {
      email: 'valentina@escuela.mx',
      password: 'Secreto1!',
    });
  });

  it('mapea correo tomado, contraseña incorrecta y sesión caducada', async () => {
    put.mockRejectedValueOnce(
      new HttpError(409, JSON.stringify({ error: 'email_taken' })),
    );
    await expect(updateEmailRemote('otra@escuela.mx', 'Secreto1!')).resolves.toEqual({
      ok: false,
      error: 'email_taken',
    });

    put.mockRejectedValueOnce(
      new HttpError(400, JSON.stringify({ error: 'invalid_credentials' })),
    );
    await expect(updateEmailRemote('otra@escuela.mx', 'mala')).resolves.toEqual({
      ok: false,
      error: 'invalid_credentials',
    });

    put.mockRejectedValueOnce(new HttpError(401, ''));
    await expect(updateEmailRemote('otra@escuela.mx', 'Secreto1!')).resolves.toEqual({
      ok: false,
      error: 'session_expired',
    });
  });
});

function input() {
  return {
    username: 'valentina',
    password: 'Secreto1!',
    displayName: 'Valentina Ríos',
    email: 'valentina@escuela.mx',
  };
}

function linkInput() {
  return {
    externalKey: '11111111-1111-4111-8111-111111111111',
    username: 'valentina',
    password: 'Secreto1!',
    displayName: 'Valentina Ríos',
    code: '123456',
  };
}
