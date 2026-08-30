import type { Metadata } from "next";
import { AgentResearchBoardDemoBar } from "@/components/AgentResearchBoardDemoBar";
import { AgentResearchBoardWebMcp } from "@/components/AgentResearchBoardWebMcp";
import { AgentResearchBoardWorkspace } from "@/components/AgentResearchBoardWorkspace";
import { AgentUtilityIndexProductDirection } from "@/components/AgentUtilityIndexProductDirection";

export const metadata: Metadata = {
  title: "Live WebMCP Demo | Agent Utility Index",
  description: "Humans control the rules. Agents control the research. A live shared decision board powered by WebMCP.",
  robots: { index: false, follow: false }
};

export default function AgentUtilityIndexDemoPage() {
  return (
    <>
      <AgentResearchBoardWebMcp />
      <AgentResearchBoardDemoBar />
      <AgentResearchBoardWorkspace />
      <AgentUtilityIndexProductDirection />
    </>
  );
}
