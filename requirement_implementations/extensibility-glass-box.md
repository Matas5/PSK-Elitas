# Extensibility / Glass-box Extensibility

**Status:** TODO - being relocated.

The previous showcase lived on the auth seam (`AuthenticationStrategy` interface + sibling `@Service` impls swapped by `@Profile`/`@Primary`). With the login page now showing Google and Local **simultaneously** by user demand, that swap-one-for-the-other story no longer reads as a Strategy demonstration, so the apparatus has been removed.

and or a new showcase will move the Strategy (and an optional GoF Decorator) onto the **risk-level classification** algorithm, which today lives in `frontend/src/constants/risk.js` (`classifyRiskLevel`). That migration is tracked separately; this file will be rewritten with the new file:line evidence once it lands.
