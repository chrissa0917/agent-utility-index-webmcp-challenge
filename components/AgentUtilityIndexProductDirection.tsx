const layers = [
  {
    title: "Agent creates the board",
    description: "The AI turns the user's research goal into a shared decision board with explicit must-have requirements."
  },
  {
    title: "Agent researches normally",
    description: "The AI can use its own search and browsing abilities, then writes candidates and source-backed evidence into the live page through WebMCP."
  },
  {
    title: "Human changes the page",
    description: "The person can add or remove a requirement directly on the board instead of re-explaining the entire task in chat."
  },
  {
    title: "Agent reads the new state",
    description: "The agent calls the WebMCP board tools, sees the new revision, and knows exactly which evidence checks are now missing."
  },
  {
    title: "Both see the same decision",
    description: "Candidates, evidence, missing checks, and activity stay visible in one shared browser surface while the conversation continues."
  }
];

export function AgentUtilityIndexProductDirection() {
  return (
    <section className="border-t border-[#DED8CB] bg-[#FBF8F1] text-[#1D1D1B]">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#9A651C]">Why WebMCP matters here</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#1D1D1B]">The webpage becomes shared working memory between the human and the agent.</h2>
            <p className="mt-4 text-base leading-7 text-[#625D53]">
              The point is not to build another research chatbot. The human can change the decision directly in the browser while the agent can read and update that exact same state through WebMCP.
            </p>
            <div className="mt-6 rounded-2xl border border-[#DED8CB] bg-white p-5">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A651C]">Demo moment</div>
              <p className="mt-3 text-sm leading-6 text-[#5F5A51]">
                Add a new requirement on the page while the agent is working. The board revision changes, the agent reads the update, and continues only on the evidence that is now missing.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {layers.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-[#DED8CB] bg-white p-5 md:p-6">
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A651C]">Step {index + 1}</div>
                <h3 className="mt-3 text-lg font-semibold text-[#1D1D1B]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B665C]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
