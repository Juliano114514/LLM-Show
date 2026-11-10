// Versioned evidence bookkeeping. This never generates an aesthetic score.
export function bodyAnatomicalGate(audits=[],bodyHash){
  const reviews=audits.filter(entry=>entry.reviewedBodyHash===bodyHash);
  const blockers=reviews.filter(entry=>entry.requiresRevision===true);
  const resolved=new Set(reviews.filter(entry=>entry.requiresRevision===false&&Array.isArray(entry.confirmedFindings)&&entry.confirmedFindings.length===0).flatMap(entry=>Array.isArray(entry.resolvesBodyHashes)?entry.resolvesBodyHashes.filter(hash=>/^[a-f0-9]{64}$/.test(hash)):[]));
  const outstandingHistory=audits.filter(entry=>entry.requiresRevision===true&&entry.reviewedBodyHash!==bodyHash&&!resolved.has(entry.reviewedBodyHash));
  const completedPreflights=new Set(reviews.filter(entry=>entry.requiresRevision===false&&entry.requiresFurtherAudit===false).flatMap(entry=>Array.isArray(entry.resolvesFurtherAuditReports)?entry.resolvesFurtherAuditReports:[]));
  const furtherAuditRequired=reviews.filter(entry=>entry.requiresFurtherAudit===true&&!completedPreflights.has(entry.sourceReport));
  return {
    status:blockers.length?'revision-required':outstandingHistory.length||furtherAuditRequired.length?'pending':reviews.length?'no-confirmed-blocker':'not-reviewed',
    tolerancePercent:5,
    scope:'Only explicitly audited regions; not a whole-body mathematical error claim.',
    policy:'A new body hash requires an independent audit explicitly resolving previous confirmed body hashes; seeds and unrelated edits cannot clear findings.',
    reviews,blockers,outstandingHistory,furtherAuditRequired,
  };
}
