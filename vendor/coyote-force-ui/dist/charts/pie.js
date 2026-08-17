"use client";
import { TrendingUp, ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react';
import * as RechartsPrimitive from 'recharts';
import { PieChart, Pie, LabelList, Sector, Label } from 'recharts';
import { Slot, Select as Select$1 } from 'radix-ui';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';

// src/components/charts/pie/pie-simple.tsx
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function Card({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      "data-size": size,
      className: cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded bg-card py-4 text-sm text-card-foreground ring-1 ring-graphite/40 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 has-[>[data-slot=card-image]:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t *:[img:last-child]:rounded-b *:[[data-slot=card-image]:first-child]:rounded-t *:[[data-slot=card-image]:last-child]:rounded-b",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      ),
      ...props
    }
  );
}
function CardTitle({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "h3";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "card-title",
      className: cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      ),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-4 group-data-[size=sm]/card:px-3", className),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-footer",
      className: cn(
        "flex items-center rounded-b border-t border-border bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      ),
      ...props
    }
  );
}
var THEMES = { light: "", dark: ".dark" };
var INITIAL_DIMENSION = { width: 320, height: 200 };
var ChartContext = React.createContext(null);
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}
function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;
  return /* @__PURE__ */ jsx(ChartContext.Provider, { value: { config }, children: /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "chart",
      "data-chart": chartId,
      className: cn(
        "flex aspect-video justify-center text-xs overflow-visible [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden [&_.recharts-tooltip-wrapper]:!overflow-visible",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(ChartStyle, { id: chartId, config }),
        /* @__PURE__ */ jsx(
          RechartsPrimitive.ResponsiveContainer,
          {
            initialDimension,
            children
          }
        )
      ]
    }
  ) });
}
var ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config2]) => config2.theme ?? config2.color
  );
  const focusReset = `[data-chart=${id}] *:focus,[data-chart=${id}] *:focus-visible{outline:none!important;box-shadow:none!important;}`;
  if (!colorConfig.length) {
    return /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: focusReset } });
  }
  return /* @__PURE__ */ jsx(
    "style",
    {
      dangerouslySetInnerHTML: {
        __html: Object.entries(THEMES).map(
          ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.[theme] ?? itemConfig.color;
            return color ? `  --color-${key}: ${color};` : null;
          }).join("\n")}
}
`
        ).join("\n") + focusReset
      }
    }
  );
};
var ChartTooltip = RechartsPrimitive.Tooltip;
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey
}) {
  const { config } = useChart();
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }
    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string" ? config[label]?.label ?? label : itemConfig?.label;
    if (labelFormatter) {
      return /* @__PURE__ */ jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, payload) });
    }
    if (!value) {
      return null;
    }
    return /* @__PURE__ */ jsx("div", { className: cn("font-medium", labelClassName), children: value });
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey
  ]);
  if (!active || !payload?.length) {
    return null;
  }
  const nestLabel = payload.length === 1 && indicator !== "dot";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "grid min-w-32 max-w-[300px] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      ),
      children: [
        !nestLabel ? tooltipLabel : null,
        /* @__PURE__ */ jsx("div", { className: "grid gap-1.5", children: payload.filter((item) => item.type !== "none").map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color ?? item.payload?.fill ?? item.color;
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              ),
              children: formatter && item?.value !== void 0 && item.name ? formatter(item.value, item.name, item, index, item.payload) : /* @__PURE__ */ jsxs(Fragment, { children: [
                itemConfig?.icon ? /* @__PURE__ */ jsx(itemConfig.icon, {}) : !hideIndicator && /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn(
                      "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                      {
                        "h-2.5 w-2.5": indicator === "dot",
                        "w-1": indicator === "line",
                        "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                        "my-0.5": nestLabel && indicator === "dashed"
                      }
                    ),
                    style: {
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor
                    }
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    ),
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
                        nestLabel ? tooltipLabel : null,
                        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: itemConfig?.label ?? item.name })
                      ] }),
                      item.value != null && /* @__PURE__ */ jsx("span", { className: "font-mono font-medium text-foreground tabular-nums", children: typeof item.value === "number" ? item.value.toLocaleString() : String(item.value) })
                    ]
                  }
                )
              ] })
            },
            index
          );
        }) })
      ]
    }
  );
}
var ChartLegend = RechartsPrimitive.Legend;
function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey
}) {
  const { config } = useChart();
  if (!payload?.length) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      ),
      children: payload.filter((item) => item.type !== "none").map((item, index) => {
        const key = `${nameKey ?? item.dataKey ?? "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            ),
            children: [
              itemConfig?.icon && !hideIcon ? /* @__PURE__ */ jsx(itemConfig.icon, {}) : /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-2 w-2 shrink-0 rounded-[2px]",
                  style: {
                    backgroundColor: item.color
                  }
                }
              ),
              itemConfig?.label
            ]
          },
          index
        );
      })
    }
  );
}
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) {
    return void 0;
  }
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : void 0;
  let configLabelKey = key;
  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key];
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key];
  }
  return configLabelKey in config ? config[configLabelKey] : config[key];
}
var chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieSimple() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig,
        className: "mx-auto aspect-square max-h-[250px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(Pie, { data: chartData, dataKey: "visitors", nameKey: "browser" })
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData2 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig2 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieSeparatorNone() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Separator None" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig2,
        className: "mx-auto aspect-square max-h-[250px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: chartData2,
              dataKey: "visitors",
              nameKey: "browser",
              stroke: "0"
            }
          )
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData3 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig3 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieLabel() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Label" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig3,
        className: "mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(ChartTooltip, { content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true }) }),
          /* @__PURE__ */ jsx(Pie, { data: chartData3, dataKey: "visitors", label: true, nameKey: "browser" })
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData4 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig4 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieLabelCustom() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Custom Label" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig4,
        className: "mx-auto aspect-square max-h-[250px] px-0",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { nameKey: "visitors", hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: chartData4,
              dataKey: "visitors",
              labelLine: false,
              label: ({ payload, ...props }) => {
                return /* @__PURE__ */ jsx(
                  "text",
                  {
                    cx: props.cx,
                    cy: props.cy,
                    x: props.x,
                    y: props.y,
                    textAnchor: props.textAnchor,
                    dominantBaseline: props.dominantBaseline,
                    fill: "var(--foreground)",
                    children: payload.visitors
                  }
                );
              },
              nameKey: "browser"
            }
          )
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData5 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig5 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieLabelList() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Label List" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig5,
        className: "mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { nameKey: "visitors", hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(Pie, { data: chartData5, dataKey: "visitors", children: /* @__PURE__ */ jsx(
            LabelList,
            {
              dataKey: "browser",
              className: "fill-background",
              stroke: "none",
              fontSize: 12,
              formatter: (value) => chartConfig5[value]?.label
            }
          ) })
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData6 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig6 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieLegend() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Legend" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig6,
        className: "mx-auto aspect-square max-h-[300px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(Pie, { data: chartData6, dataKey: "visitors" }),
          /* @__PURE__ */ jsx(
            ChartLegend,
            {
              content: /* @__PURE__ */ jsx(ChartLegendContent, { nameKey: "browser" }),
              className: "-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            }
          )
        ] })
      }
    ) })
  ] });
}
var chartData7 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig7 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieDonut() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Donut" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig7,
        className: "mx-auto aspect-square max-h-[250px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: chartData7,
              dataKey: "visitors",
              nameKey: "browser",
              innerRadius: 60
            }
          )
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData8 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" }
];
var chartConfig8 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
var ACTIVE_INDEX = 0;
function ChartPieDonutActive() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Donut Active" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig8,
        className: "mx-auto aspect-square max-h-[250px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: chartData8,
              dataKey: "visitors",
              nameKey: "browser",
              innerRadius: 60,
              strokeWidth: 5,
              shape: ({
                index,
                outerRadius = 0,
                ...props
              }) => index === ACTIVE_INDEX ? /* @__PURE__ */ jsx(Sector, { ...props, outerRadius: outerRadius + 10 }) : /* @__PURE__ */ jsx(Sector, { ...props, outerRadius })
            }
          )
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData9 = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 190, fill: "var(--color-other)" }
];
var chartConfig9 = {
  visitors: {
    label: "Visitors"
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)"
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)"
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)"
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)"
  },
  other: {
    label: "Other",
    color: "var(--chart-5)"
  }
};
function ChartPieDonutText() {
  const totalVisitors = React.useMemo(() => {
    return chartData9.reduce((acc, curr) => acc + curr.visitors, 0);
  }, []);
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Donut with Text" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig9,
        className: "mx-auto aspect-square max-h-[250px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: chartData9,
              dataKey: "visitors",
              nameKey: "browser",
              innerRadius: 60,
              strokeWidth: 5,
              children: /* @__PURE__ */ jsx(
                Label,
                {
                  content: ({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return /* @__PURE__ */ jsxs(
                        "text",
                        {
                          x: viewBox.cx,
                          y: viewBox.cy,
                          textAnchor: "middle",
                          dominantBaseline: "middle",
                          children: [
                            /* @__PURE__ */ jsx(
                              "tspan",
                              {
                                x: viewBox.cx,
                                y: viewBox.cy,
                                className: "fill-foreground text-3xl font-bold",
                                children: totalVisitors.toLocaleString()
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "tspan",
                              {
                                x: viewBox.cx,
                                y: (viewBox.cy || 0) + 24,
                                className: "fill-muted-foreground",
                                children: "Visitors"
                              }
                            )
                          ]
                        }
                      );
                    }
                  }
                }
              )
            }
          )
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var desktopData = [
  { month: "january", desktop: 186, fill: "var(--color-january)" },
  { month: "february", desktop: 305, fill: "var(--color-february)" },
  { month: "march", desktop: 237, fill: "var(--color-march)" },
  { month: "april", desktop: 173, fill: "var(--color-april)" },
  { month: "may", desktop: 209, fill: "var(--color-may)" }
];
var mobileData = [
  { month: "january", mobile: 80, fill: "var(--color-january)" },
  { month: "february", mobile: 200, fill: "var(--color-february)" },
  { month: "march", mobile: 120, fill: "var(--color-march)" },
  { month: "april", mobile: 190, fill: "var(--color-april)" },
  { month: "may", mobile: 130, fill: "var(--color-may)" }
];
var chartConfig10 = {
  visitors: {
    label: "Visitors"
  },
  desktop: {
    label: "Desktop"
  },
  mobile: {
    label: "Mobile"
  },
  january: {
    label: "January",
    color: "var(--chart-1)"
  },
  february: {
    label: "February",
    color: "var(--chart-2)"
  },
  march: {
    label: "March",
    color: "var(--chart-3)"
  },
  april: {
    label: "April",
    color: "var(--chart-4)"
  },
  may: {
    label: "May",
    color: "var(--chart-5)"
  }
};
function ChartPieStacked() {
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "items-center pb-0", children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Stacked" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex-1 pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig10,
        className: "mx-auto aspect-square max-h-[250px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              content: /* @__PURE__ */ jsx(
                ChartTooltipContent,
                {
                  labelKey: "visitors",
                  nameKey: "month",
                  indicator: "line",
                  labelFormatter: (_, payload) => {
                    const key = payload?.[0]?.dataKey;
                    return key ? chartConfig10[key]?.label : null;
                  }
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(Pie, { data: desktopData, dataKey: "desktop", outerRadius: 60 }),
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: mobileData,
              dataKey: "mobile",
              innerRadius: 70,
              outerRadius: 90
            }
          )
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxs(CardFooter, { className: "flex-col gap-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
function Select({
  ...props
}) {
  return /* @__PURE__ */ jsx(Select$1.Root, { "data-slot": "select", ...props });
}
function SelectValue({
  ...props
}) {
  return /* @__PURE__ */ jsx(Select$1.Value, { "data-slot": "select-value", ...props });
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    Select$1.Trigger,
    {
      "data-slot": "select-trigger",
      "data-size": size,
      className: cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(Select$1.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "pointer-events-none size-4 text-muted-foreground" }) })
      ]
    }
  );
}
function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}) {
  return /* @__PURE__ */ jsx(Select$1.Portal, { children: /* @__PURE__ */ jsxs(
    Select$1.Content,
    {
      "data-slot": "select-content",
      "data-align-trigger": position === "item-aligned",
      className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
      position,
      align,
      ...props,
      children: [
        /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx(
          Select$1.Viewport,
          {
            "data-position": position,
            className: cn(
              "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
              position === "popper" && ""
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx(SelectScrollDownButton, {})
      ]
    }
  ) });
}
function SelectItem({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    Select$1.Item,
    {
      "data-slot": "select-item",
      className: cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute right-2 flex size-4 items-center justify-center", children: /* @__PURE__ */ jsx(Select$1.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "pointer-events-none" }) }) }),
        /* @__PURE__ */ jsx(Select$1.ItemText, { children })
      ]
    }
  );
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Select$1.ScrollUpButton,
    {
      "data-slot": "select-scroll-up-button",
      className: cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        ChevronUpIcon,
        {}
      )
    }
  );
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Select$1.ScrollDownButton,
    {
      "data-slot": "select-scroll-down-button",
      className: cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        ChevronDownIcon,
        {}
      )
    }
  );
}
var desktopData2 = [
  { month: "january", desktop: 186, fill: "var(--color-january)" },
  { month: "february", desktop: 305, fill: "var(--color-february)" },
  { month: "march", desktop: 237, fill: "var(--color-march)" },
  { month: "april", desktop: 173, fill: "var(--color-april)" },
  { month: "may", desktop: 209, fill: "var(--color-may)" }
];
var chartConfig11 = {
  visitors: {
    label: "Visitors"
  },
  desktop: {
    label: "Desktop"
  },
  mobile: {
    label: "Mobile"
  },
  january: {
    label: "January",
    color: "var(--chart-1)"
  },
  february: {
    label: "February",
    color: "var(--chart-2)"
  },
  march: {
    label: "March",
    color: "var(--chart-3)"
  },
  april: {
    label: "April",
    color: "var(--chart-4)"
  },
  may: {
    label: "May",
    color: "var(--chart-5)"
  }
};
function ChartPieInteractive() {
  const id = "pie-interactive";
  const [activeMonth, setActiveMonth] = React.useState(desktopData2[0].month);
  const activeIndex = React.useMemo(
    () => desktopData2.findIndex((item) => item.month === activeMonth),
    [activeMonth]
  );
  const months = React.useMemo(() => desktopData2.map((item) => item.month), []);
  const renderPieShape = React.useCallback(
    ({ index, outerRadius = 0, ...props }) => {
      if (index === activeIndex) {
        return /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx(Sector, { ...props, outerRadius: outerRadius + 10 }),
          /* @__PURE__ */ jsx(
            Sector,
            {
              ...props,
              outerRadius: outerRadius + 25,
              innerRadius: outerRadius + 12
            }
          )
        ] });
      }
      return /* @__PURE__ */ jsx(Sector, { ...props, outerRadius });
    },
    [activeIndex]
  );
  return /* @__PURE__ */ jsxs(Card, { "data-chart": id, className: "flex flex-col", children: [
    /* @__PURE__ */ jsx(ChartStyle, { id, config: chartConfig11 }),
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex-row items-start space-y-0 pb-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Pie Chart - Interactive" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "January - June 2024" })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: activeMonth, onValueChange: setActiveMonth, children: [
        /* @__PURE__ */ jsx(
          SelectTrigger,
          {
            className: "ml-auto h-7 w-[130px] rounded-lg pl-2.5",
            "aria-label": "Select a value",
            children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select month" })
          }
        ),
        /* @__PURE__ */ jsx(SelectContent, { align: "end", className: "rounded-xl", children: months.map((key) => {
          const config = chartConfig11[key];
          if (!config) {
            return null;
          }
          return /* @__PURE__ */ jsx(
            SelectItem,
            {
              value: key,
              className: "rounded-lg [&_span]:flex",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "flex h-3 w-3 shrink-0 rounded-xs",
                    style: {
                      backgroundColor: `var(--color-${key})`
                    }
                  }
                ),
                config?.label
              ] })
            },
            key
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex flex-1 justify-center pb-0", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        id,
        config: chartConfig11,
        className: "mx-auto aspect-square w-full max-w-[300px]",
        children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: desktopData2,
              dataKey: "desktop",
              nameKey: "month",
              innerRadius: 60,
              strokeWidth: 5,
              shape: renderPieShape,
              children: /* @__PURE__ */ jsx(
                Label,
                {
                  content: ({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return /* @__PURE__ */ jsxs(
                        "text",
                        {
                          x: viewBox.cx,
                          y: viewBox.cy,
                          textAnchor: "middle",
                          dominantBaseline: "middle",
                          children: [
                            /* @__PURE__ */ jsx(
                              "tspan",
                              {
                                x: viewBox.cx,
                                y: viewBox.cy,
                                className: "fill-foreground text-3xl font-bold",
                                children: desktopData2[activeIndex]?.desktop.toLocaleString()
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "tspan",
                              {
                                x: viewBox.cx,
                                y: (viewBox.cy || 0) + 24,
                                className: "fill-muted-foreground",
                                children: "Visitors"
                              }
                            )
                          ]
                        }
                      );
                    }
                  }
                }
              )
            }
          )
        ] })
      }
    ) })
  ] });
}

export { ChartPieDonut, ChartPieDonutActive, ChartPieDonutText, ChartPieInteractive, ChartPieLabel, ChartPieLabelCustom, ChartPieLabelList, ChartPieLegend, ChartPieSeparatorNone, ChartPieSimple, ChartPieStacked };
//# sourceMappingURL=pie.js.map
//# sourceMappingURL=pie.js.map