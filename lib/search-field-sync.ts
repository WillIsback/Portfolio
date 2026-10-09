export interface SearchFieldSync {
	field: string;
	/** Valeurs poussées par la saisie et pas encore revues dans l'URL. */
	pushed: string[];
	/** Changement externe de l'URL : la mise à jour différée en attente est périmée. */
	cancelPending: boolean;
}

/**
 * Décide comment le champ de recherche suit le paramètre `search` de l'URL.
 * Un écho de notre propre poussée est consommé sans toucher à la saisie en cours ;
 * tout autre changement (retour/avance, Réinitialiser…) réécrit le champ.
 */
export function nextSearchField(input: {
	urlSearch: string;
	prevUrlSearch: string;
	pushed: string[];
	field: string;
}): SearchFieldSync {
	const { urlSearch, prevUrlSearch, pushed, field } = input;
	if (urlSearch === prevUrlSearch)
		return { field, pushed, cancelPending: false };
	const echo = pushed.lastIndexOf(urlSearch);
	if (echo !== -1)
		return { field, pushed: pushed.slice(echo + 1), cancelPending: false };
	return { field: urlSearch, pushed: [], cancelPending: true };
}
