export default function isSubDomain(url: string) {
  return url.split(".").length > 2 ? true : false;
}
