# Defex Quality Review — setup and hackathon evidence

Status: implemented; live Nebius inference and production deployment must be verified before claiming the integration works. The existing physical MVP video has already been submitted by the founder. It does not demonstrate this new reporting workflow.

## Deployment

Keep the existing Django/Vercel project. Add these server-side Vercel environment variables for Production and Preview, then redeploy the feature commit:

- `NEBIUS_API_KEY`: your Token Factory API key. Never put it in browser code or Git.
- `NEBIUS_MODEL`: exact model ID from the current Nebius catalog; select a text model supporting JSON mode. No hardcoded model is assumed available.
- `REVIEW_ACCESS_CODE`: a separate random access code for your own CSV reports. Public synthetic samples do not require it.
- `REVIEW_ENABLED=1` (default). Set to `0` to disable provider calls immediately on the next deployment.

Configure a provider spending/credit limit and platform rate limiting before public sharing. In-process caching, concurrency protection, and cooldowns are best-effort only: they are NOT global spend limits across Vercel instances. Every uncached sample report consumes tokens. The endpoint uses a fixed Nebius API origin, a 20-second read timeout, and no automatic retries. Model availability, JSON support, and the Vercel function duration must be checked in a real deployment.

Official API reference: https://docs.tokenfactory.nebius.com/quickstart
Official JSON-mode reference: https://docs.tokenfactory.nebius.com/ai-models-inference/json

## What the feature does

`/quality-review/` → choose a synthetic sample or load a CSV → review deterministic statistics → consent to share aggregates → Nebius prioritizes findings and proposes human checks → download the report and source evidence.

Physical inference stays on Jetson. This new reporting workflow requires cloud inference. Product labels, defect labels, hourly aggregates and warnings are sent to Nebius. Images and raw CSV rows are not. Source statistics are computed by Python, never by the model. Reports include evidence IDs validated against the supplied facts, measured provider time, model ID, token usage when returned, and a completion ID. Valid references do not by themselves prove every prose claim is correct: human evaluation remains necessary.

No mock AI fallback exists. Missing credentials, malformed input, refusal, timeout, truncated output, and invalid evidence references fail explicitly. Custom reports are not persisted by the app. Only public synthetic examples are cached. Cached reports are labeled with their original inference time and do not count as new evaluation attempts.

CSV schema: `timestamp,product,decision,defect_class,confidence`. One inspection per row; no multi-detection rows for one part. Timestamp needs a timezone; timestamps normalize to UTC. Missing confidence is allowed and flagged. Product codes must be non-identifying. Dataset limits: 256 KB, 5,000 rows, 24 products/classes, 48 hourly groups.

## Real evaluation (still required)

With the two Nebius environment variables set, run:

```bash
python scripts/evaluate_quality_review.py --output evidence/nebius-evaluation.json
```

The command makes three real inference calls on the bundled synthetic cases and saves outputs, exact input hashes, token usage, and task times. It does not fabricate quality scores. Review each full output against the expected finding, source counts, and absence of unsupported causal claims. Record quality scores and notes manually. Expand with customer-approved representative records when available; do not describe synthetic tests as factory accuracy measurements.

The uncertainty case is an explicit limitation test: low confidence and missing values prevent reliable causal conclusions. Even perfect agreement with this report rubric cannot establish detection precision/recall; that needs independently labeled physical inspections.

## Supplement the submitted hardware video

Record a short screen demonstration: load defect-spike → inspect counts → generate a real report → compare cited evidence → show model/time and JSON download → run uncertain and explain why root cause is unknown. Judge can run synthetic reports without physical hardware or their own API key once the backend is configured.

## Submission text — only after a successful live run

Defex combines on-device defect inspection with a new quality-review workflow for factory managers. In this reporting workflow, Nebius Token Factory performs the inference that turns aggregate inspection evidence into prioritized findings, suggested checks, and explicit limitations. Python computes source counts and rates; the report cites those facts so the manager can inspect its claims. The physical inspection stays local; report generation uses cloud inference. The submitted physical MVP video covers the hardware, and the supplementary screen demonstration covers the Nebius integration. Judges can run the included synthetic examples at the Quality Review page. Evaluation results, measured task times, and a low-confidence limitation case are attached separately.

Do not submit this as completed evidence until the live URL, evaluation output, and demonstration exist. State the exact new hackathon work separately from the earlier MVP. Report samples as synthetic. Do not invent timings, accuracy, customer results, or claim a guaranteed prize. Organizers decide whether this reporting workflow satisfies their “main product flow” requirement.
