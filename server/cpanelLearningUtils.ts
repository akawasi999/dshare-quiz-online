export function normalizeCpanelLearningSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 170) || "quiz";
}

export function buildTopicPath(parentPath: string | null, topicId: number) {
  return parentPath ? `${parentPath}${topicId}/` : `/${topicId}/`;
}

export function isTopicDescendantPath(candidateParentPath: string, topicPath: string) {
  return candidateParentPath.startsWith(topicPath);
}

export function remapDescendantPath(childPath: string, oldRootPath: string, newRootPath: string) {
  return childPath.replace(oldRootPath, newRootPath);
}
