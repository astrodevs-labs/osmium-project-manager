import approvedPr from './approved-pr'
import changesRequestedPr from './changes-requested-pr'

export = (context: any) => {
  if (context.payload.review.state === 'approved')
    return approvedPr(context)
  else if (context.payload.review.state === 'changes_requested')
    return changesRequestedPr(context)
  console.log(`Ignoring review state ${context.payload.review.state}`)
  return
}