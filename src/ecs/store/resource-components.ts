
export type ResourceComponents = object;

// @ts-expect-error
type ChedkForError = ResourceComponents["foo"]
