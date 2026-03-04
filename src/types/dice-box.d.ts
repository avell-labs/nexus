declare module "@3d-dice/dice-box" {
  interface DiceBoxConfig {
    container?: string;
    origin?: string;
    assetPath?: string;
    scale?: number;
    theme?: string;
    offscreen?: boolean;
  }

  interface DiceResult {
    value: number;
  }

  export default class DiceBox {
    constructor(config?: DiceBoxConfig);
    onRollComplete?: (results: DiceResult[]) => void;
    init(): Promise<unknown>;
    roll(
      notation: string,
      options?: { theme?: string; themeColor?: string; newStartPoint?: boolean },
    ): Promise<unknown>;
  }
}
