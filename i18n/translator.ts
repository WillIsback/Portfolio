/**
 * Traducteur next-intl réduit à sa forme appelable, pour que les modules de `lib/`
 * puissent recevoir un traducteur sans dépendre de `next-intl`.
 *
 * Les paramètres sont `any` et non `string` à dessein : le traducteur fourni par
 * `getTranslations("status")` est typé par clé (`(key: "status.done") => string`) et ne
 * serait pas assignable à `(key: string, values?: string) => string` sous
 * `strictFunctionTypes`. `any` est bidirectionnellement assignable, donc un traducteur
 * next-intl reste assignable ici sans `as unknown as Translator`.
 *
 * `values` est présent parce que certains messages sont paramétrés (`{course}`,
 * `{count, plural, …}`) ; sans lui, `lib/` ne pourrait pas les composer.
 */
export type Translator = (key: any, values?: any) => string;
