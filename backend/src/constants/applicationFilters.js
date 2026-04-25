/**
 * Submitted applications visible to providers/admins (drafts excluded).
 * Call this for each query so the returned object is never shared/mutated across requests.
 */
export function buildSubmittedToProviderFilter() {
  return {
    $or: [
      { submissionStatus: 'submitted' },
      { submissionStatus: { $exists: false } },
    ],
  };
}
