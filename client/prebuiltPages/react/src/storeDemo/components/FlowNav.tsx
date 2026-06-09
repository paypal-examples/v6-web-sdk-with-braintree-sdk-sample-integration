import { Link } from "react-router-dom";

interface FlowNavProps {
  flowLabel: string;
  steps?: { label: string; to?: string }[];
}

export const FlowNav: React.FC<FlowNavProps> = ({ flowLabel, steps = [] }) => (
  <nav className="flow-nav">
    <Link to="/">← Home</Link>
    <span className="flow-nav-sep">/</span>
    <span className="flow-nav-flow">{flowLabel}</span>
    {steps.map((step, i) => (
      <span key={i}>
        <span className="flow-nav-sep">/</span>
        {step.to ? <Link to={step.to}>{step.label}</Link> : <span>{step.label}</span>}
      </span>
    ))}
  </nav>
);
