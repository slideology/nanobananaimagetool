import { Image } from "~/components/common";

interface Step {
  title: string;
  description: string;
}

export interface HowItWorksSectionProps {
  title: string;
  subtitle: string;
  steps: Step[];
  cover?: string;
}

export default function HowItWorksSection({
  title,
  subtitle,
  steps,
  cover: imageUrl,
}: HowItWorksSectionProps) {
  return (
    <div className="py-8 md:py-12 bg-primary/15 relative">
      <div id="how-it-works" className="absolute -top-24" />
      <div className="container text-center">
        <h2 className="text-2xl md:text-3xl mb-2 font-bold">{title}</h2>
        <p className="text-base max-w-3xl mx-auto">{subtitle}</p>

        <div className="flex justify-center my-4 md:my-8 lg:my-12">
          <ul className="list text-center max-w-2xl">
            {steps.map((step, i) => (
              <li className="list-row" key={i}>
                <div className="text-2xl md:text-4xl font-thin tabular-nums">
                  0{i + 1}
                </div>
                <div className="list-col-grow">
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="text-sm">{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
