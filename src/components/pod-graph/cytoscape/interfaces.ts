import { Core } from 'cytoscape';

interface PanzoomOptions {
  fitSelector?: string;
  animateOnFit?: boolean;
  animateOnZoom?: boolean;
  zoomFactor?: number;
  zoomDelay?: number;
  minZoom?: number;
  maxZoom?: number;
  fitPadding?: number;
  panSpeed?: number;
  panDistance?: number;
  panDragAreaSize?: number;
  panMinPercentSpeed?: number;
  panInactiveArea?: number;
  panIndicatorMinOpacity?: number;
  zoomOnly?: boolean;
  fitAnimationDuration?: number;
  sliderHandleIcon?: string;
  zoomInIcon?: string;
  zoomOutIcon?: string;
  resetIcon?: string;
}

type CardElement = string;

interface NodeHtmlLabelArgument {
  query: string,
  halign: string,
  valign: string,
  halignBox: string,
  valignBox: string,
  tpl: (data: unknown) => CardElement
}

interface ExtendedCyOptions {
  panzoom: (options: PanzoomOptions) => void
  nodeHtmlLabel: (input: NodeHtmlLabelArgument[]) => void
}

export type ExtendedCore = Core & ExtendedCyOptions;

export type CoreWithPanzoom = Core & Pick<ExtendedCyOptions, 'panzoom'>;

export type CoreWithNodeLabel = Core & Pick<ExtendedCyOptions, 'nodeHtmlLabel'>;
