export function buildBoxLabelUrl(origin: string, boxId: string) {
  return new URL(`/boxes/${boxId}`, origin).toString();
}
