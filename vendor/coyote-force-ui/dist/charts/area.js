"use client";
import { TrendingUp, Activity, TrendingDown, ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react';
import * as RechartsPrimitive from 'recharts';
import { AreaChart, CartesianGrid, XAxis, Area, YAxis } from 'recharts';
import { Slot, Select as Select$1 } from 'radix-ui';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';

// src/components/charts/area/area-default.tsx
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
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 }
];
var chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  }
};
function ChartAreaDefault() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData,
        margin: {
          left: 12,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { indicator: "line" })
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData2 = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 }
];
var chartConfig2 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  }
};
function ChartAreaLinear() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Linear" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig2, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData2,
        margin: {
          left: 12,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { indicator: "dot", hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "linear",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData3 = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 }
];
var chartConfig3 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
    icon: Activity
  }
};
function ChartAreaStep() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Step" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig3, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData3,
        margin: {
          left: 12,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "step",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData4 = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];
var chartConfig4 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
};
function ChartAreaStacked() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Stacked" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig4, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData4,
        margin: {
          left: 12,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { indicator: "dot" })
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "mobile",
              type: "natural",
              fill: "var(--color-mobile)",
              fillOpacity: 0.4,
              stroke: "var(--color-mobile)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)",
              stackId: "a"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData5 = [
  { month: "January", desktop: 186, mobile: 80, other: 45 },
  { month: "February", desktop: 305, mobile: 200, other: 100 },
  { month: "March", desktop: 237, mobile: 120, other: 150 },
  { month: "April", desktop: 73, mobile: 190, other: 50 },
  { month: "May", desktop: 209, mobile: 130, other: 100 },
  { month: "June", desktop: 214, mobile: 140, other: 160 }
];
var chartConfig5 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  },
  other: {
    label: "Other",
    color: "var(--chart-3)"
  }
};
function ChartAreaStackedExpand() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Stacked Expanded" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig5, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData5,
        margin: {
          left: 12,
          right: 12,
          top: 12
        },
        stackOffset: "expand",
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { indicator: "line" })
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "other",
              type: "natural",
              fill: "var(--color-other)",
              fillOpacity: 0.1,
              stroke: "var(--color-other)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "mobile",
              type: "natural",
              fill: "var(--color-mobile)",
              fillOpacity: 0.4,
              stroke: "var(--color-mobile)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)",
              stackId: "a"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData6 = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];
var chartConfig6 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
};
function ChartAreaGradient() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Gradient" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig6, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData6,
        margin: {
          left: 12,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(ChartTooltip, { cursor: false, content: /* @__PURE__ */ jsx(ChartTooltipContent, {}) }),
          /* @__PURE__ */ jsxs("defs", { children: [
            /* @__PURE__ */ jsxs("linearGradient", { id: "fillDesktop", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "5%",
                  stopColor: "var(--color-desktop)",
                  stopOpacity: 0.8
                }
              ),
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "95%",
                  stopColor: "var(--color-desktop)",
                  stopOpacity: 0.1
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "fillMobile", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "5%",
                  stopColor: "var(--color-mobile)",
                  stopOpacity: 0.8
                }
              ),
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "95%",
                  stopColor: "var(--color-mobile)",
                  stopOpacity: 0.1
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "mobile",
              type: "natural",
              fill: "url(#fillMobile)",
              fillOpacity: 0.4,
              stroke: "var(--color-mobile)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "url(#fillDesktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)",
              stackId: "a"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData7 = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];
var chartConfig7 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
};
function ChartAreaLegend() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Legend" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig7, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData7,
        margin: {
          left: 12,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { indicator: "line" })
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "mobile",
              type: "natural",
              fill: "var(--color-mobile)",
              fillOpacity: 0.4,
              stroke: "var(--color-mobile)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(ChartLegend, { content: /* @__PURE__ */ jsx(ChartLegendContent, {}) })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData8 = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];
var chartConfig8 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
};
function ChartAreaAxes() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Axes" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig8, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData8,
        margin: {
          left: -20,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickCount: 3
            }
          ),
          /* @__PURE__ */ jsx(ChartTooltip, { cursor: false, content: /* @__PURE__ */ jsx(ChartTooltipContent, {}) }),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "mobile",
              type: "natural",
              fill: "var(--color-mobile)",
              fillOpacity: 0.4,
              stroke: "var(--color-mobile)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)",
              stackId: "a"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
  ] });
}
var chartData9 = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];
var chartConfig9 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
    icon: TrendingDown
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
    icon: TrendingUp
  }
};
function ChartAreaIcons() {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Icons" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 6 months" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig9, children: /* @__PURE__ */ jsxs(
      AreaChart,
      {
        accessibilityLayer: true,
        data: chartData9,
        margin: {
          left: 12,
          right: 12
        },
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "month",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(ChartTooltipContent, { indicator: "line" })
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "mobile",
              type: "natural",
              fill: "var(--color-mobile)",
              fillOpacity: 0.4,
              stroke: "var(--color-mobile)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "var(--color-desktop)",
              fillOpacity: 0.4,
              stroke: "var(--color-desktop)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(ChartLegend, { content: /* @__PURE__ */ jsx(ChartLegendContent, {}) })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsx(CardFooter, { children: /* @__PURE__ */ jsx("div", { className: "flex w-full items-start gap-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 leading-none text-muted-foreground", children: "January - June 2024" })
    ] }) }) })
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
var chartData10 = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 }
];
var chartConfig10 = {
  visitors: {
    label: "Visitors"
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
};
function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d");
  const filteredData = chartData10.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = /* @__PURE__ */ new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });
  return /* @__PURE__ */ jsxs(Card, { className: "pt-0", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid flex-1 gap-1", children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Area Chart - Interactive" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Showing total visitors for the last 3 months" })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: timeRange, onValueChange: setTimeRange, children: [
        /* @__PURE__ */ jsx(
          SelectTrigger,
          {
            className: "hidden w-[160px] rounded-lg sm:ml-auto sm:flex",
            "aria-label": "Select a value",
            children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Last 3 months" })
          }
        ),
        /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-xl", children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "90d", className: "rounded-lg", children: "Last 3 months" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "30d", className: "rounded-lg", children: "Last 30 days" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "7d", className: "rounded-lg", children: "Last 7 days" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "px-2 pt-4 sm:px-6 sm:pt-6", children: /* @__PURE__ */ jsx(
      ChartContainer,
      {
        config: chartConfig10,
        className: "aspect-auto h-[250px] w-full",
        children: /* @__PURE__ */ jsxs(AreaChart, { data: filteredData, children: [
          /* @__PURE__ */ jsxs("defs", { children: [
            /* @__PURE__ */ jsxs("linearGradient", { id: "fillDesktop", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "5%",
                  stopColor: "var(--color-desktop)",
                  stopOpacity: 0.8
                }
              ),
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "95%",
                  stopColor: "var(--color-desktop)",
                  stopOpacity: 0.1
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("linearGradient", { id: "fillMobile", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "5%",
                  stopColor: "var(--color-mobile)",
                  stopOpacity: 0.8
                }
              ),
              /* @__PURE__ */ jsx(
                "stop",
                {
                  offset: "95%",
                  stopColor: "var(--color-mobile)",
                  stopOpacity: 0.1
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "date",
              tickLine: false,
              axisLine: false,
              tickMargin: 8,
              minTickGap: 32,
              tickFormatter: (value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                });
              }
            }
          ),
          /* @__PURE__ */ jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsx(
                ChartTooltipContent,
                {
                  labelFormatter: (value) => {
                    return new Date(value).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric"
                      }
                    );
                  },
                  indicator: "dot"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "mobile",
              type: "natural",
              fill: "url(#fillMobile)",
              stroke: "var(--color-mobile)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(
            Area,
            {
              dataKey: "desktop",
              type: "natural",
              fill: "url(#fillDesktop)",
              stroke: "var(--color-desktop)",
              stackId: "a"
            }
          ),
          /* @__PURE__ */ jsx(ChartLegend, { content: /* @__PURE__ */ jsx(ChartLegendContent, {}) })
        ] })
      }
    ) })
  ] });
}

export { ChartAreaAxes, ChartAreaDefault, ChartAreaGradient, ChartAreaIcons, ChartAreaInteractive, ChartAreaLegend, ChartAreaLinear, ChartAreaStacked, ChartAreaStackedExpand, ChartAreaStep };
//# sourceMappingURL=area.js.map
//# sourceMappingURL=area.js.map