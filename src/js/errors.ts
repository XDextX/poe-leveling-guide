/* Errores con un mensaje pensado para el usuario (los del navegador, como un base64 inválido, no lo son). */

type UserError = Error & { own: true };

export const userError = (msg: string): UserError => Object.assign(new Error(msg), { own: true as const });
export const isUserError = (e: unknown): e is UserError => e instanceof Error && (e as Partial<UserError>).own === true;
