export type ScaleLoad = { key: string; label: string; count: number };
/** Representative physical shapes; exact counts are repeated in the readable load list. */
export function CalibrationWeight({
  load,
  id,
  scale = 1,
  compact = false,
  side = "right",
}: {
  load: ScaleLoad;
  id: string;
  scale?: number;
  compact?: boolean;
  side?: "left" | "right";
}) {
  const plate = load.label.includes("мг"),
    amount = Number.parseFloat(load.label.replace(",", ".")) || 1;
  const width = plate ? 19 : 17 + Math.min(10, Math.log10(amount + 1) * 5),
    height = plate ? 6 : 15 + Math.min(7, Math.log10(amount + 1) * 3);
  return (
    <g
      data-instrument="weight-bundle"
      data-weight={load.key}
      data-count={load.count}
      data-side={side}
    >
      <title>{`${load.count}×${load.label}${load.count > 3 ? " · згрупований показ" : ""}`}</title>
      <g transform={`scale(${scale})`}>
        {Array.from(
          { length: Math.min(load.count, 3) },
          (_, i) => Math.min(load.count, 3) - 1 - i,
        ).map((i) => (
          <g key={i} transform={`translate(${i * 1.5} ${-i * 2.4})`}>
            {plate ? (
              <>
                <path
                  d={`M${-width / 2} -6H${width / 2 - 3}l3 3V0H${-width / 2}Z`}
                  fill={`url(#${id}-steel)`}
                  stroke="#71858b"
                  strokeWidth=".6"
                />
                <path
                  d={`M${width / 2 - 3} -6v4h3`}
                  fill="none"
                  stroke="#dfe8eb"
                  strokeWidth=".8"
                />
                <path
                  d={`M${-width / 2 + 3} -4H${width / 2 - 5}`}
                  stroke="#eaf0f1"
                  strokeWidth=".65"
                />
              </>
            ) : (
              <>
                <path
                  d={`M${-width / 2} ${-height * 0.7}Q${-width / 2} ${-height * 0.85} 0 ${-height * 0.85}Q${width / 2} ${-height * 0.85} ${width / 2} ${-height * 0.7}V-2Q0 3 ${-width / 2} -2Z`}
                  fill={`url(#${id}-brass)`}
                  stroke="#92733d"
                  strokeWidth=".65"
                />
                <ellipse
                  cx="0"
                  cy={-height * 0.7}
                  rx={width / 2}
                  ry="3"
                  fill="#e7d498"
                  stroke="#a28a51"
                  strokeWidth=".5"
                />
                <rect
                  x={-width * 0.12}
                  y={-height - 1}
                  width={width * 0.24}
                  height={height * 0.4}
                  rx="1"
                  fill={`url(#${id}-brass)`}
                  stroke="#9a7c40"
                  strokeWidth=".5"
                />
                <ellipse
                  cx="0"
                  cy={-height - 1}
                  rx={width * 0.2}
                  ry="2"
                  fill="#e7d59a"
                  stroke="#a78b4f"
                  strokeWidth=".45"
                />
                <path
                  d={`M${-width * 0.28} ${-height * 0.55}v${height * 0.4}`}
                  stroke="#f5e5b4"
                  strokeWidth="1"
                  opacity=".6"
                />
              </>
            )}
          </g>
        ))}
        <text
          x="0"
          y={plate ? -1 : -height * 0.26}
          textAnchor="middle"
          style={{
            fontSize: plate ? 4.5 : 5.5,
            fontWeight: 650,
            fill: plate ? "#354e50" : "#6d542a",
          }}
        >
          {`${amount}${plate ? " мг" : " г"}`}
        </text>
      </g>
      {!compact && (
        <text
          x="0"
          y={-(height + 8) * scale - 2}
          textAnchor="middle"
          style={{ fontSize: 7.7, fontWeight: 600, fill: "#47604b" }}
        >
          {load.count}×{load.label}
        </text>
      )}
      {compact && load.count > 1 && (
        <text
          x={(width * scale) / 2 + 1}
          y={-5 * scale}
          style={{ fontSize: 6.5, fontWeight: 650, fill: "#355140" }}
        >
          ×{load.count}
        </text>
      )}
    </g>
  );
}
export function BalanceObject({
  index = 0,
  bag = false,
  id,
}: {
  index?: number;
  bag?: boolean;
  id: string;
}) {
  if (bag)
    return (
      <g data-instrument="balance-object" data-object="bag">
        <ellipse cx="0" cy="0" rx="29" ry="4" fill="#40513e" opacity=".15" />
        <path
          d="M-23 -2Q-31 -27 -13 -49L-17 -60Q0 -67 17 -60L13 -49Q31 -27 23 -2Q0 5 -23 -2Z"
          fill={`url(#${id}-canvas)`}
          stroke="#9a8861"
          strokeWidth=".9"
        />
        <path
          d="M-15 -60Q0 -55 15 -60M-12 -49Q0 -43 12 -49M-18 -7Q-19 -29 -6 -42M16 -6Q20 -25 8 -41M0 -5V-40"
          fill="none"
          stroke="#b7a67d"
          strokeWidth="1.1"
          opacity=".75"
        />
        <path
          d="M-11 -48Q0 -44 12 -48M-11 -46Q0 -42 12 -46"
          stroke="#746d46"
          strokeWidth="1.3"
          fill="none"
        />
        <path
          d="M-1 -46q-12 -10-13-3t13 3q10-12 13-4t-13 4m1 0l-6 12m6-12l9 11"
          fill="none"
          stroke="#8e7950"
          strokeWidth="1"
        />
        <path
          d="M-9 -60l5-3 6 1 4-2 6 4"
          fill="#8a9385"
          stroke="#6d7d70"
          strokeWidth=".7"
        />
      </g>
    );
  if (index === 1)
    return (
      <g data-instrument="balance-object" data-object="block">
        <ellipse cy="0" rx="30" ry="4" fill="#40513e" opacity=".15" />
        <path
          d="M-26 -31l9-7h44l-9 7Z"
          fill="#dec39a"
          stroke="#a98c63"
          strokeWidth=".7"
        />
        <path
          d="M18 -31l9-7V-7l-9 7Z"
          fill="#986d42"
          stroke="#8d6944"
          strokeWidth=".7"
        />
        <path
          d="M-26 -31H18V0H-26Z"
          fill={`url(#${id}-wood)`}
          stroke="#a5875d"
          strokeWidth=".7"
        />
        <path
          d="M-23 -24q16-4 37 0M-22 -15q13 4 36-1M-21 -6q12-2 35 0"
          fill="none"
          stroke="#9b784c"
          strokeWidth=".6"
          opacity=".45"
        />
      </g>
    );
  if (index === 2)
    return (
      <g data-instrument="balance-object" data-object="stone">
        <ellipse cy="0" rx="29" ry="4" fill="#40513e" opacity=".16" />
        <path
          d="M-26 -3l-3-13 12-19 24-4 19 13 4 17-12 9Z"
          fill={`url(#${id}-stone)`}
          stroke="#6e7b76"
          strokeWidth=".8"
        />
        <path
          d="M-17 -35l7 19 17-23M-10 -16l28 16M-10 -16l-16 13M-10 -16l36-10"
          fill="none"
          stroke="#c4cbc4"
          strokeWidth=".9"
          opacity=".65"
        />
        <path d="M7 -39l19 13-14 5Z" fill="#9eaaa1" opacity=".7" />
      </g>
    );
  if (index === 3)
    return (
      <g data-instrument="balance-object" data-object="coin">
        <ellipse cy="1" rx="21" ry="4" fill="#40513e" opacity=".15" />
        <path
          d="M-20 -5q20 9 40 0v4q-20 9-40 0Z"
          fill="#ad8547"
          stroke="#8f703d"
          strokeWidth=".6"
        />
        <ellipse
          cy="-5"
          rx="20"
          ry="6"
          fill={`url(#${id}-brass)`}
          stroke="#a28244"
          strokeWidth=".8"
        />
        <ellipse
          cy="-5"
          rx="16"
          ry="4"
          fill="none"
          stroke="#ecd89e"
          strokeWidth=".7"
        />
        <path d="M-6 -5h12M0 -7v4" stroke="#b89b5d" strokeWidth=".7" />
      </g>
    );
  return (
    <g data-instrument="balance-object" data-object="headphones">
      <ellipse cy="1" rx="31" ry="4" fill="#40513e" opacity=".15" />
      <path
        d="M-26 -16Q-31 -26 -24 -36Q0 -45 24 -36Q31 -26 26 -16Z"
        fill="#b0c1c6"
        stroke="#758c92"
        strokeWidth=".8"
      />
      <path
        d="M-22 -18Q-26 -27 -21 -33Q0 -39 21 -33Q26 -27 22 -18Z"
        fill="#e9efed"
        stroke="#b5c4c5"
        strokeWidth=".6"
      />
      <path
        d="M-27 -19Q0 -28 27 -19V-7Q27 2 15 2H-15Q-27 2-27-7Z"
        fill={`url(#${id}-case)`}
        stroke="#889f9f"
        strokeWidth=".8"
      />
      {[-10, 10].map((x) => (
        <g key={x}>
          <path
            d={`M${x - 4} -21q-4-3-1-7t7-1q4 3 0 7v9q0 3-3 2Z`}
            fill="#f7faf7"
            stroke="#adbdbb"
            strokeWidth=".55"
          />
          <ellipse cx={x} cy="-26" rx="2" ry="1.3" fill="#829793" />
        </g>
      ))}
      <path
        d="M-22 -12Q0 -16 22 -12"
        fill="none"
        stroke="#fbfdf9"
        strokeWidth="1"
        opacity=".7"
      />
      <circle cy="-5" r="1.1" fill="#84b58b" />
    </g>
  );
}
