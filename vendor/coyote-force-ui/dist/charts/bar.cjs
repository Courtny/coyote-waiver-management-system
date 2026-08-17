"use client";
'use strict';

var lucideReact = require('lucide-react');
var RechartsPrimitive = require('recharts');
var radixUi = require('radix-ui');
var clsx = require('clsx');
var tailwindMerge = require('tailwind-merge');
var jsxRuntime = require('react/jsx-runtime');
var React = require('react');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var RechartsPrimitive__namespace = /*#__PURE__*/_interopNamespace(RechartsPrimitive);
var React__namespace = /*#__PURE__*/_interopNamespace(React);

// src/components/charts/bar/bar-default.tsx
function cn(...inputs) {
  return tailwindMerge.twMerge(clsx.clsx(inputs));
}
function Card({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
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
  const Comp = asChild ? radixUi.Slot.Root : "h3";
  return /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-4 group-data-[size=sm]/card:px-3", className),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
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
var ChartContext = React__namespace.createContext(null);
function useChart() {
  const context = React__namespace.useContext(ChartContext);
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
  const uniqueId = React__namespace.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;
  return /* @__PURE__ */ jsxRuntime.jsx(ChartContext.Provider, { value: { config }, children: /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsx(ChartStyle, { id: chartId, config }),
        /* @__PURE__ */ jsxRuntime.jsx(
          RechartsPrimitive__namespace.ResponsiveContainer,
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
    return /* @__PURE__ */ jsxRuntime.jsx("style", { dangerouslySetInnerHTML: { __html: focusReset } });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
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
var ChartTooltip = RechartsPrimitive__namespace.Tooltip;
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
  const tooltipLabel = React__namespace.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }
    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string" ? config[label]?.label ?? label : itemConfig?.label;
    if (labelFormatter) {
      return /* @__PURE__ */ jsxRuntime.jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, payload) });
    }
    if (!value) {
      return null;
    }
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: cn("font-medium", labelClassName), children: value });
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
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: cn(
        "grid min-w-32 max-w-[300px] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      ),
      children: [
        !nestLabel ? tooltipLabel : null,
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "grid gap-1.5", children: payload.filter((item) => item.type !== "none").map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color ?? item.payload?.fill ?? item.color;
          return /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              className: cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              ),
              children: formatter && item?.value !== void 0 && item.name ? formatter(item.value, item.name, item, index, item.payload) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                itemConfig?.icon ? /* @__PURE__ */ jsxRuntime.jsx(itemConfig.icon, {}) : !hideIndicator && /* @__PURE__ */ jsxRuntime.jsx(
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
                /* @__PURE__ */ jsxRuntime.jsxs(
                  "div",
                  {
                    className: cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    ),
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid gap-1.5", children: [
                        nestLabel ? tooltipLabel : null,
                        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground", children: itemConfig?.label ?? item.name })
                      ] }),
                      item.value != null && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "font-mono font-medium text-foreground tabular-nums", children: typeof item.value === "number" ? item.value.toLocaleString() : String(item.value) })
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
var ChartLegend = RechartsPrimitive__namespace.Legend;
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
  return /* @__PURE__ */ jsxRuntime.jsx(
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
        return /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            className: cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            ),
            children: [
              itemConfig?.icon && !hideIcon ? /* @__PURE__ */ jsxRuntime.jsx(itemConfig.icon, {}) : /* @__PURE__ */ jsxRuntime.jsx(
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
function ChartBarDefault() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig, children: /* @__PURE__ */ jsxRuntime.jsxs(RechartsPrimitive.BarChart, { accessibilityLayer: true, data: chartData, children: [
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { vertical: false }),
      /* @__PURE__ */ jsxRuntime.jsx(
        RechartsPrimitive.XAxis,
        {
          dataKey: "month",
          tickLine: false,
          tickMargin: 10,
          axisLine: false,
          tickFormatter: (value) => value.slice(0, 3)
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        ChartTooltip,
        {
          cursor: false,
          content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { hideLabel: true })
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Bar, { dataKey: "desktop", fill: "var(--color-desktop)", radius: 8 })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
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
function ChartBarHorizontal() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Horizontal" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig2, children: /* @__PURE__ */ jsxRuntime.jsxs(
      RechartsPrimitive.BarChart,
      {
        accessibilityLayer: true,
        data: chartData2,
        layout: "vertical",
        margin: {
          left: -20
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.XAxis, { type: "number", dataKey: "desktop", hide: true }),
          /* @__PURE__ */ jsxRuntime.jsx(
            RechartsPrimitive.YAxis,
            {
              dataKey: "month",
              type: "category",
              tickLine: false,
              tickMargin: 10,
              axisLine: false,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Bar, { dataKey: "desktop", fill: "var(--color-desktop)", radius: 5 })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData3 = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 }
];
var chartConfig3 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
};
function ChartBarMultiple() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Multiple" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig3, children: /* @__PURE__ */ jsxRuntime.jsxs(RechartsPrimitive.BarChart, { accessibilityLayer: true, data: chartData3, children: [
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { vertical: false }),
      /* @__PURE__ */ jsxRuntime.jsx(
        RechartsPrimitive.XAxis,
        {
          dataKey: "month",
          tickLine: false,
          tickMargin: 10,
          axisLine: false,
          tickFormatter: (value) => value.slice(0, 3)
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        ChartTooltip,
        {
          cursor: false,
          content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { indicator: "dashed" })
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Bar, { dataKey: "desktop", fill: "var(--color-desktop)", radius: 4 }),
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Bar, { dataKey: "mobile", fill: "var(--color-mobile)", radius: 4 })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
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
function ChartBarStacked() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Stacked + Legend" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig4, children: /* @__PURE__ */ jsxRuntime.jsxs(RechartsPrimitive.BarChart, { accessibilityLayer: true, data: chartData4, children: [
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { vertical: false }),
      /* @__PURE__ */ jsxRuntime.jsx(
        RechartsPrimitive.XAxis,
        {
          dataKey: "month",
          tickLine: false,
          tickMargin: 10,
          axisLine: false,
          tickFormatter: (value) => value.slice(0, 3)
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(ChartTooltip, { content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { hideLabel: true }) }),
      /* @__PURE__ */ jsxRuntime.jsx(ChartLegend, { content: /* @__PURE__ */ jsxRuntime.jsx(ChartLegendContent, {}) }),
      /* @__PURE__ */ jsxRuntime.jsx(
        RechartsPrimitive.Bar,
        {
          dataKey: "desktop",
          stackId: "a",
          fill: "var(--color-desktop)",
          radius: [0, 0, 4, 4]
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        RechartsPrimitive.Bar,
        {
          dataKey: "mobile",
          stackId: "a",
          fill: "var(--color-mobile)",
          radius: [4, 4, 0, 0]
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData5 = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 }
];
var chartConfig5 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  }
};
function ChartBarLabel() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Label" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig5, children: /* @__PURE__ */ jsxRuntime.jsxs(
      RechartsPrimitive.BarChart,
      {
        accessibilityLayer: true,
        data: chartData5,
        margin: {
          top: 20
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsxRuntime.jsx(
            RechartsPrimitive.XAxis,
            {
              dataKey: "month",
              tickLine: false,
              tickMargin: 10,
              axisLine: false,
              tickFormatter: (value) => value.slice(0, 3)
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Bar, { dataKey: "desktop", fill: "var(--color-desktop)", radius: 8, children: /* @__PURE__ */ jsxRuntime.jsx(
            RechartsPrimitive.LabelList,
            {
              position: "top",
              offset: 12,
              className: "fill-foreground",
              fontSize: 12
            }
          ) })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
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
    color: "var(--chart-2)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  },
  label: {
    color: "var(--background)"
  }
};
function ChartBarLabelCustom() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Custom Label" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig6, children: /* @__PURE__ */ jsxRuntime.jsxs(
      RechartsPrimitive.BarChart,
      {
        accessibilityLayer: true,
        data: chartData6,
        layout: "vertical",
        margin: {
          right: 16
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { horizontal: false }),
          /* @__PURE__ */ jsxRuntime.jsx(
            RechartsPrimitive.YAxis,
            {
              dataKey: "month",
              type: "category",
              tickLine: false,
              tickMargin: 10,
              axisLine: false,
              tickFormatter: (value) => value.slice(0, 3),
              hide: true
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.XAxis, { dataKey: "desktop", type: "number", hide: true }),
          /* @__PURE__ */ jsxRuntime.jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { indicator: "line" })
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs(RechartsPrimitive.Bar, { dataKey: "desktop", fill: "var(--color-desktop)", radius: 4, children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              RechartsPrimitive.LabelList,
              {
                dataKey: "month",
                position: "insideLeft",
                offset: 8,
                className: "fill-(--color-label)",
                fontSize: 12
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              RechartsPrimitive.LabelList,
              {
                dataKey: "desktop",
                position: "right",
                offset: 8,
                className: "fill-foreground",
                fontSize: 12
              }
            )
          ] })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
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
function ChartBarMixed() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Mixed" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig7, children: /* @__PURE__ */ jsxRuntime.jsxs(
      RechartsPrimitive.BarChart,
      {
        accessibilityLayer: true,
        data: chartData7,
        layout: "vertical",
        margin: {
          left: 0
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            RechartsPrimitive.YAxis,
            {
              dataKey: "browser",
              type: "category",
              tickLine: false,
              tickMargin: 10,
              axisLine: false,
              tickFormatter: (value) => chartConfig7[value]?.label
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.XAxis, { dataKey: "visitors", type: "number", hide: true }),
          /* @__PURE__ */ jsxRuntime.jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { hideLabel: true })
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Bar, { dataKey: "visitors", radius: 5 })
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData8 = [
  { browser: "chrome", visitors: 187, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 275, fill: "var(--color-firefox)" },
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
var ACTIVE_INDEX = 2;
function ChartBarActive() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Active" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig8, children: /* @__PURE__ */ jsxRuntime.jsxs(RechartsPrimitive.BarChart, { accessibilityLayer: true, data: chartData8, children: [
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { vertical: false }),
      /* @__PURE__ */ jsxRuntime.jsx(
        RechartsPrimitive.XAxis,
        {
          dataKey: "browser",
          tickLine: false,
          tickMargin: 10,
          axisLine: false,
          tickFormatter: (value) => chartConfig8[value]?.label
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        ChartTooltip,
        {
          cursor: false,
          content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { hideLabel: true })
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        RechartsPrimitive.Bar,
        {
          dataKey: "visitors",
          strokeWidth: 2,
          radius: 8,
          shape: ({ index, ...props }) => index === ACTIVE_INDEX ? /* @__PURE__ */ jsxRuntime.jsx(
            RechartsPrimitive.Rectangle,
            {
              ...props,
              fillOpacity: 0.8,
              stroke: props.payload.fill,
              strokeDasharray: 4,
              strokeDashoffset: 4
            }
          ) : /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Rectangle, { ...props })
        }
      )
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
}
var chartData9 = [
  { month: "January", visitors: 186 },
  { month: "February", visitors: 205 },
  { month: "March", visitors: -207 },
  { month: "April", visitors: 173 },
  { month: "May", visitors: -209 },
  { month: "June", visitors: 214 }
];
var chartConfig9 = {
  visitors: {
    label: "Visitors"
  }
};
function ChartBarNegative() {
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Negative" }),
      /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "January - June 2024" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntime.jsx(ChartContainer, { config: chartConfig9, children: /* @__PURE__ */ jsxRuntime.jsxs(RechartsPrimitive.BarChart, { accessibilityLayer: true, data: chartData9, children: [
      /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { vertical: false }),
      /* @__PURE__ */ jsxRuntime.jsx(
        ChartTooltip,
        {
          cursor: false,
          content: /* @__PURE__ */ jsxRuntime.jsx(ChartTooltipContent, { hideLabel: true, hideIndicator: true })
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs(RechartsPrimitive.Bar, { dataKey: "visitors", children: [
        /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.LabelList, { position: "top", dataKey: "month", fillOpacity: 1 }),
        chartData9.map((item) => /* @__PURE__ */ jsxRuntime.jsx(
          RechartsPrimitive.Cell,
          {
            fill: item.visitors > 0 ? "var(--chart-1)" : "var(--chart-2)"
          },
          item.month
        ))
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(CardFooter, { className: "flex-col items-start gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex gap-2 leading-none font-medium", children: [
        "Trending up by 5.2% this month ",
        /* @__PURE__ */ jsxRuntime.jsx(lucideReact.TrendingUp, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "leading-none text-muted-foreground", children: "Showing total visitors for the last 6 months" })
    ] })
  ] });
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
  views: {
    label: "Page Views"
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-2)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-1)"
  }
};
function ChartBarInteractive() {
  const [activeChart, setActiveChart] = React__namespace.useState("desktop");
  const total = React__namespace.useMemo(
    () => ({
      desktop: chartData10.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData10.reduce((acc, curr) => acc + curr.mobile, 0)
    }),
    []
  );
  return /* @__PURE__ */ jsxRuntime.jsxs(Card, { className: "py-0", children: [
    /* @__PURE__ */ jsxRuntime.jsxs(CardHeader, { className: "flex flex-col items-stretch border-b p-0! sm:flex-row", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!", children: [
        /* @__PURE__ */ jsxRuntime.jsx(CardTitle, { children: "Bar Chart - Interactive" }),
        /* @__PURE__ */ jsxRuntime.jsx(CardDescription, { children: "Showing total visitors for the last 3 months" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex", children: ["desktop", "mobile"].map((key) => {
        const chart = key;
        return /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            "data-active": activeChart === chart,
            className: "relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6",
            onClick: () => setActiveChart(chart),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs text-muted-foreground", children: chartConfig10[chart].label }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-lg leading-none font-bold sm:text-3xl", children: total[key].toLocaleString() })
            ]
          },
          chart
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(CardContent, { className: "px-2 sm:p-6", children: /* @__PURE__ */ jsxRuntime.jsx(
      ChartContainer,
      {
        config: chartConfig10,
        className: "aspect-auto h-[250px] w-full",
        children: /* @__PURE__ */ jsxRuntime.jsxs(
          RechartsPrimitive.BarChart,
          {
            accessibilityLayer: true,
            data: chartData10,
            margin: {
              left: 12,
              right: 12
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.CartesianGrid, { vertical: false }),
              /* @__PURE__ */ jsxRuntime.jsx(
                RechartsPrimitive.XAxis,
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
              /* @__PURE__ */ jsxRuntime.jsx(
                ChartTooltip,
                {
                  content: /* @__PURE__ */ jsxRuntime.jsx(
                    ChartTooltipContent,
                    {
                      className: "w-[150px]",
                      nameKey: "views",
                      labelFormatter: (value) => {
                        return new Date(value).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          }
                        );
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(RechartsPrimitive.Bar, { dataKey: activeChart, fill: `var(--color-${activeChart})` })
            ]
          }
        )
      }
    ) })
  ] });
}

exports.ChartBarActive = ChartBarActive;
exports.ChartBarDefault = ChartBarDefault;
exports.ChartBarHorizontal = ChartBarHorizontal;
exports.ChartBarInteractive = ChartBarInteractive;
exports.ChartBarLabel = ChartBarLabel;
exports.ChartBarLabelCustom = ChartBarLabelCustom;
exports.ChartBarMixed = ChartBarMixed;
exports.ChartBarMultiple = ChartBarMultiple;
exports.ChartBarNegative = ChartBarNegative;
exports.ChartBarStacked = ChartBarStacked;
//# sourceMappingURL=bar.cjs.map
//# sourceMappingURL=bar.cjs.map