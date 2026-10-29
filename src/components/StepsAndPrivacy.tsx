import React from 'react';
import { Lock, Cpu, WifiOff } from 'lucide-react';

export const StepsAndPrivacy: React.FC = () => {
  const steps = [
    {
      title: 'Add',
      desc: 'Drop files on the page or pick them from your device.',
    },
    {
      title: 'Adjust',
      desc: 'Set quality, width, format or page ranges. Defaults are sensible.',
    },
    {
      title: 'Save',
      desc: 'Download the result. It was made in this tab and never sent anywhere.',
    },
  ];

  return (
    <>
      {/* Three Steps Section */}
      <section className="mx-auto max-w-7xl px-5 py-20 border-t border-line">
        <h2 className="max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-fg sm:text-6xl">
          Three steps. No account, no queue, no upload bar.
        </h2>

        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step, idx) => (
            <li
              key={step.title}
              className="border-t border-fg pt-4"
              style={{ marginTop: `${idx * 28}px` }}
            >
              <span className="font-display text-sm font-semibold text-accent">
                Step {idx + 1}
              </span>
              <h3 className="mt-2 font-display text-3xl font-bold text-fg">
                {step.title}
              </h3>
              <p className="mt-2 text-mute text-sm leading-relaxed">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Privacy Guarantee Section */}
      <section id="privacy" className="scroll-mt-16 bg-card py-20 text-fg transition-colors">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
          <div>
            <Lock className="text-accent mb-4" size={32} />
            <h2 className="font-display text-4xl font-bold sm:text-5xl tracking-tight">
              Your files never leave your device.
            </h2>
          </div>

          <div className="space-y-6 text-mute leading-relaxed text-sm sm:text-base">
            <p>
              Every tool runs with your browser’s own code. There is no upload step, so there is no server copy to leak, store or sell.
            </p>

            <div className="flex items-start gap-3.5">
              <Cpu className="shrink-0 text-accent mt-0.5" size={20} />
              <span>
                Large files use your device’s memory, so we cap each file at 50 MB to keep browsers and phones responsive.
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <WifiOff className="shrink-0 text-accent mt-0.5" size={20} />
              <span>
                Open your browser’s Network tab while you run any tool. You’ll see zero network payloads sent.
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
