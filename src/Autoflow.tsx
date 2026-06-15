// Required dependencies: npm install @fluentui/react-icons
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Person24Regular,
  People24Regular,
  Shield24Regular,
  LockClosed24Regular,
  Key24Regular,
  Laptop24Regular,
  Phone24Regular,
  Server24Regular,
  Cloud24Regular,
  Database24Regular,
  Mail24Regular,
  Chat24Regular,
  Call24Regular,
  Alert24Regular,
  Checkmark24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Question24Regular,
  Document24Regular,
  Folder24Regular,
  Link24Regular,
  Building24Regular,
  Money24Regular,
  Briefcase24Regular,
  DataArea24Regular,
  Bug24Regular,
  Rocket24Regular,
  Bookmark24Regular,
  Flag24Regular,
  Star24Regular,
  Search24Regular,
  Globe24Regular,
  Power24Regular,
  Router24Regular,
  Desktop24Regular,
  Settings24Regular,
  Clock24Regular,
  Bot24Regular,
  Sparkle24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  ThumbLike24Regular,
  ThumbDislike24Regular,
  ArrowSync24Regular,
  History24Regular,
  Code24Regular,
  Branch24Regular,
  PuzzlePiece24Regular,
  Box24Regular,
  Calendar24Regular,
  Timer24Regular,
  VehicleTruckProfile24Regular,
  Handshake24Regular,
  Target24Regular,
  Megaphone24Regular,
  Receipt24Regular,
  Headset24Regular,
  Wrench24Regular,
  Toolbox24Regular,
  HardDrive24Regular,
  CloudArrowUp24Regular,
  ShieldKeyhole24Regular,
  PeopleTeam24Regular,
  PersonFeedback24Regular,
  NetworkCheck24Regular,
  Lightbulb24Regular,
  ArrowRight24Regular,
  ArrowForward24Regular,
  ArrowRouting24Regular,
  ArrowTrending24Regular,
  ArrowSwap24Regular,
  TicketDiagonal24Regular,
  ClipboardTask24Regular,
  Tag24Regular,
  DocumentEdit24Regular,
  DocumentAdd24Regular,
  DocumentCopy24Regular,
  FolderOpen24Regular,
  Save24Regular,
  Share24Regular,
  Print24Regular,
  WindowConsole20Regular,
  ChartMultiple24Regular,
} from '@fluentui/react-icons';

// ============= Types =============
type ShapeType =
  | 'process'
  | 'decision'
  | 'start'
  | 'end'
  | 'database'
  | 'draft';
type MediaLayout = 'left' | 'top';
type ImageFit = 'cover' | 'contain';

interface GroupData {
  id: string;
  type: 'lane' | 'pool';
  parentId: string | null;
  name: string;
  subtitle?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NodeData {
  id: string;
  lane: string | null;
  label: string;
  shape: ShapeType;
  x: number;
  y: number;
  icon?: string | null;
  image?: string | null;
  mediaLayout?: MediaLayout;
  imageFit?: ImageFit;
}

interface EdgeStyle {
  type: 'solid' | 'gradient';
  dash: 'none' | 'dashed' | 'dotted';
  color: string;
  color2?: string;
  width: number;
}

interface EdgeData {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle | null;
}

interface GraphState {
  groups: GroupData[];
  nodes: NodeData[];
  edges: EdgeData[];
  layoutSpacing: number;
  minHeight?: number;
}

interface HistoryState {
  past: GraphState[];
  present: GraphState;
  future: GraphState[];
}

interface DragState {
  type: 'node' | 'pan' | 'connect' | 'group' | 'group-resize';
  id?: string;
  from?: string;
  startX?: number;
  startY?: number;
  panX?: number;
  panY?: number;
  offsetX?: number;
  offsetY?: number;
  startWidth?: number;
  startHeight?: number;
  snapshot?: GraphState;
}

interface Toast {
  id: string;
  message: string;
  kind: string;
}

interface Lane {
  id: string;
  name: string;
  subtitle?: string;
  width: number;
}

// ============= Autoflow Design Tokens =============
const tokens = {
  neutralBackground1: '#ffffff',
  neutralBackground2: '#f7fafa',
  neutralBackground3: '#f3f4f6',
  neutralBackground4: '#e5e7eb',
  canvasLaneBackground: '#eef5f5',
  neutralForeground1: '#242424',
  neutralForeground2: '#424242',
  neutralForeground3: '#616161',
  neutralForegroundDisabled: '#bdbdbd',
  neutralStroke1: '#d1d1d1',
  neutralStroke2: '#e0e0e0',
  brandBackground: '#ff8300',
  brandBackgroundHover: '#e87600',
  brandForeground: '#ff8300',
  brandStroke1: '#ff8300',
  accent: '#d83b01',
  shadow2:
    '0 0 2px rgba(216, 231, 231, 0.4), 0 1px 2px rgba(216, 231, 231, 0.6)',
  shadow4:
    '0 0 2px rgba(216, 231, 231, 0.4), 0 2px 4px rgba(216, 231, 231, 0.7)',
  shadow8:
    '0 0 2px rgba(216, 231, 231, 0.4), 0 4px 8px rgba(180, 200, 200, 0.8)',
  shadow16:
    '0 0 2px rgba(216, 231, 231, 0.4), 0 8px 16px rgba(180, 200, 200, 0.9)',
  shadow28:
    '0 0 8px rgba(216, 231, 231, 0.5), 0 14px 28px rgba(160, 185, 185, 0.95)',
  radiusSmall: '4px',
  radiusMedium: '6px',
  radiusLarge: '8px',
  radiusXLarge: '12px',
  radiusCircular: '9999px',
  fontFamily:
    '"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
};

const uid = () => Math.random().toString(36).slice(2, 10);
const snap = (v: number) => Math.round(v / 8) * 8;

const DEFAULT_LANE_W = 320;
const DEFAULT_LANE_H = 400;
const NODE_W = 172;
const NODE_H = 56;
const HISTORY_LIMIT = 50;

const getNodeHeight = (n: NodeData) => {
  const hasMedia = !!(n.icon || n.image);
  if (!hasMedia || n.mediaLayout !== 'top') return NODE_H;
  if (n.image && n.imageFit === 'cover') return 212;
  return 140;
};

// ============= UI Helper Icons =============
const Icon = ({
  path,
  size = 16,
  style,
}: {
  path: string;
  size?: number;
  style?: React.CSSProperties;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="currentColor"
    style={style}
  >
    <path d={path} />
  </svg>
);

const uiIcons: Record<string, string> = {
  add: 'M10 2.5a.75.75 0 0 1 .75.75v6h6a.75.75 0 0 1 0 1.5h-6v6a.75.75 0 0 1-1.5 0v-6h-6a.75.75 0 0 1 0-1.5h6v-6A.75.75 0 0 1 10 2.5z',
  trash:
    'M8.5 4h3a1.5 1.5 0 0 0-3 0zm-1 0a2.5 2.5 0 0 1 5 0h4a.5.5 0 0 1 0 1h-1.05l-.88 9.64A2.5 2.5 0 0 1 12.08 17H7.92a2.5 2.5 0 0 1-2.49-2.36L4.55 5H3.5a.5.5 0 0 1 0-1z',
  copy: 'M5 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4zm2 0v10h6V4H7zm-3 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h-1.5v1a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5h1V7H4z',
  palette:
    'M10 2a8 8 0 1 0 .5 16 1.5 1.5 0 0 0 1.4-2 1.6 1.6 0 0 1 1.5-2.2h1.7A3 3 0 0 0 18 10.8 8 8 0 0 0 10 2zm-4 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1.5-3.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM10 6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.5 1a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  chevron:
    'M5.7 7.3a1 1 0 0 1 1.4 0L10 10.2l2.9-2.9a1 1 0 1 1 1.4 1.4l-3.6 3.6a1 1 0 0 1-1.4 0L5.7 8.7a1 1 0 0 1 0-1.4z',
  swim: 'M3 4.5A.5.5 0 0 1 3.5 4h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4A.5.5 0 0 1 3.5 8h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z',
  branch:
    'M6 3a2 2 0 1 0-1 3.7v6.6a2 2 0 1 0 2 0V11h2a4 4 0 0 0 4-4V6.7A2 2 0 1 0 11 6.7V7a2 2 0 0 1-2 2H7V6.7A2 2 0 0 0 6 3z',
  magic:
    'M14.5 2.5a1 1 0 0 1 1 1v1h1a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0v-1h-1a1 1 0 0 1 0-2h1v-1a1 1 0 0 1 1-1zM7.3 5.3a1 1 0 0 1 1.4 0l5 5 1.6-1.6a1 1 0 0 1 1.7.7v5.1a1 1 0 0 1-1 1h-5.1a1 1 0 0 1-.7-1.7l1.6-1.6-5-5a1 1 0 0 1 0-1.4l.5-.5z',
  grip: 'M7 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7 15a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
  download:
    'M10 2a.75.75 0 0 1 .75.75v8.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V2.75A.75.75 0 0 1 10 2zM3.75 15a.75.75 0 0 1 .75.75v.75c0 .14.11.25.25.25h10.5a.25.25 0 0 0 .25-.25v-.75a.75.75 0 0 1 1.5 0v.75A1.75 1.75 0 0 1 15.25 18H4.75A1.75 1.75 0 0 1 3 16.5v-.75a.75.75 0 0 1 .75-.75z',
  edit: 'M14.06 4.06a2.5 2.5 0 0 1 3.54 3.54L7.4 17.78a2 2 0 0 1-.9.51l-3.5.92a.5.5 0 0 1-.6-.6l.92-3.5a2 2 0 0 1 .5-.9z',
  menu: 'M3 5.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.75zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10zm.75 3.5a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H3.75z',
  close:
    'M4.7 4.7a1 1 0 0 1 1.4 0L10 8.6l3.9-3.9a1 1 0 1 1 1.4 1.4L11.4 10l3.9 3.9a1 1 0 1 1-1.4 1.4L10 11.4l-3.9 3.9a1 1 0 1 1-1.4-1.4L8.6 10 4.7 6.1a1 1 0 0 1 0-1.4z',
  undo: 'M8 4.5a.75.75 0 0 0-1.28-.53l-3.5 3.5a.75.75 0 0 0 0 1.06l3.5 3.5A.75.75 0 0 0 8 11.5V9.5h3.5A3.5 3.5 0 0 1 15 13v1.25a.75.75 0 0 0 1.5 0V13a5 5 0 0 0-5-5H8V4.5z',
  redo: 'M12 4.5a.75.75 0 0 1 1.28-.53l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5A.75.75 0 0 1 12 11.5V9.5H8.5A3.5 3.5 0 0 0 5 13v1.25a.75.75 0 0 1-1.5 0V13a5 5 0 0 1 5-5H12V4.5z',
  file: 'M5 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-.6-1.4l-3-3A2 2 0 0 0 12 3H5zm7 1.5V7a1 1 0 0 0 1 1h2.5L12 4.5z',
  template:
    'M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v3A1.5 1.5 0 0 1 15.5 9h-11A1.5 1.5 0 0 1 3 7.5v-3zm0 7A1.5 1.5 0 0 1 4.5 10h4A1.5 1.5 0 0 1 10 11.5v4A1.5 1.5 0 0 1 8.5 17h-4A1.5 1.5 0 0 1 3 15.5v-4zm9.5-1.5a1.5 1.5 0 0 0-1.5 1.5v4a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-4a1.5 1.5 0 0 0-1.5-1.5h-3z',
  upload:
    'M10 18a.75.75 0 0 1-.75-.75V8.56l-2.72 2.72a.75.75 0 1 1-1.06-1.06l4-4a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-2.72-2.72v8.69A.75.75 0 0 1 10 18zM3.75 3a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5h-11A.75.75 0 0 1 3.75 3z',
  picture:
    'M4 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4zm10 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM4 14l3.5-4.5L11 13l2-2 3 3v.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5z',
};

// ============= Fluent React Icons Dictionary =============
const fluentIconsMap: Record<string, { cat: string; Icon: React.FC<any> }> = {
  person: { cat: 'People', Icon: Person24Regular },
  people: { cat: 'People', Icon: People24Regular },
  team: { cat: 'People', Icon: PeopleTeam24Regular },
  handshake: { cat: 'People', Icon: Handshake24Regular },
  feedback: { cat: 'People', Icon: PersonFeedback24Regular },
  shield: { cat: 'Security', Icon: Shield24Regular },
  lock: { cat: 'Security', Icon: LockClosed24Regular },
  key: { cat: 'Security', Icon: Key24Regular },
  shieldKeyhole: { cat: 'Security', Icon: ShieldKeyhole24Regular },
  laptop: { cat: 'Devices & Infra', Icon: Laptop24Regular },
  phone: { cat: 'Devices & Infra', Icon: Phone24Regular },
  server: { cat: 'Devices & Infra', Icon: Server24Regular },
  cloud: { cat: 'Devices & Infra', Icon: Cloud24Regular },
  database: { cat: 'Devices & Infra', Icon: Database24Regular },
  power: { cat: 'Devices & Infra', Icon: Power24Regular },
  router: { cat: 'Devices & Infra', Icon: Router24Regular },
  desktop: { cat: 'Devices & Infra', Icon: Desktop24Regular },
  hardDrive: { cat: 'Devices & Infra', Icon: HardDrive24Regular },
  network: { cat: 'Devices & Infra', Icon: NetworkCheck24Regular },
  mail: { cat: 'Comms', Icon: Mail24Regular },
  chat: { cat: 'Comms', Icon: Chat24Regular },
  call: { cat: 'Comms', Icon: Call24Regular },
  megaphone: { cat: 'Comms', Icon: Megaphone24Regular },
  checkmark: { cat: 'Status', Icon: Checkmark24Regular },
  warning: { cat: 'Status', Icon: Warning24Regular },
  error: { cat: 'Status', Icon: ErrorCircle24Regular },
  info: { cat: 'Status', Icon: Info24Regular },
  question: { cat: 'Status', Icon: Question24Regular },
  bell: { cat: 'Status', Icon: Alert24Regular },
  lightbulb: { cat: 'Status', Icon: Lightbulb24Regular },
  successCircle: { cat: 'Status', Icon: CheckmarkCircle24Regular },
  failCircle: { cat: 'Status', Icon: DismissCircle24Regular },
  thumbUp: { cat: 'Status', Icon: ThumbLike24Regular },
  thumbDown: { cat: 'Status', Icon: ThumbDislike24Regular },
  arrowRight: { cat: 'Flow', Icon: ArrowRight24Regular },
  arrowForward: { cat: 'Flow', Icon: ArrowForward24Regular },
  routing: { cat: 'Flow', Icon: ArrowRouting24Regular },
  trending: { cat: 'Flow', Icon: ArrowTrending24Regular },
  swap: { cat: 'Flow', Icon: ArrowSwap24Regular },
  settings: { cat: 'Process', Icon: Settings24Regular },
  clock: { cat: 'Process', Icon: Clock24Regular },
  sync: { cat: 'Process', Icon: ArrowSync24Regular },
  history: { cat: 'Process', Icon: History24Regular },
  ticket: { cat: 'Support', Icon: TicketDiagonal24Regular },
  task: { cat: 'Support', Icon: ClipboardTask24Regular },
  tag: { cat: 'Support', Icon: Tag24Regular },
  headset: { cat: 'Support', Icon: Headset24Regular },
  wrench: { cat: 'Support', Icon: Wrench24Regular },
  toolbox: { cat: 'Support', Icon: Toolbox24Regular },
  document: { cat: 'Docs', Icon: Document24Regular },
  docEdit: { cat: 'Docs', Icon: DocumentEdit24Regular },
  docAdd: { cat: 'Docs', Icon: DocumentAdd24Regular },
  docCopy: { cat: 'Docs', Icon: DocumentCopy24Regular },
  folder: { cat: 'Docs', Icon: Folder24Regular },
  folderOpen: { cat: 'Docs', Icon: FolderOpen24Regular },
  save: { cat: 'Docs', Icon: Save24Regular },
  share: { cat: 'Docs', Icon: Share24Regular },
  print: { cat: 'Docs', Icon: Print24Regular },
  link: { cat: 'Docs', Icon: Link24Regular },
  code: { cat: 'Engineering', Icon: Code24Regular },
  console: { cat: 'Engineering', Icon: WindowConsole20Regular },
  branch: { cat: 'Engineering', Icon: Branch24Regular },
  puzzle: { cat: 'Engineering', Icon: PuzzlePiece24Regular },
  cloudDeploy: { cat: 'Engineering', Icon: CloudArrowUp24Regular },
  bot: { cat: 'AI & Auto', Icon: Bot24Regular },
  sparkle: { cat: 'AI & Auto', Icon: Sparkle24Regular },
  truck: { cat: 'Delivery', Icon: VehicleTruckProfile24Regular },
  box: { cat: 'Delivery', Icon: Box24Regular },
  calendar: { cat: 'Delivery', Icon: Calendar24Regular },
  timer: { cat: 'Delivery', Icon: Timer24Regular },
  building: { cat: 'Business', Icon: Building24Regular },
  money: { cat: 'Business', Icon: Money24Regular },
  briefcase: { cat: 'Business', Icon: Briefcase24Regular },
  chart: { cat: 'Business', Icon: DataArea24Regular },
  chartMulti: { cat: 'Business', Icon: ChartMultiple24Regular },
  target: { cat: 'Business', Icon: Target24Regular },
  receipt: { cat: 'Business', Icon: Receipt24Regular },
  bug: { cat: 'Misc', Icon: Bug24Regular },
  rocket: { cat: 'Misc', Icon: Rocket24Regular },
  bookmark: { cat: 'Misc', Icon: Bookmark24Regular },
  flag: { cat: 'Misc', Icon: Flag24Regular },
  star: { cat: 'Misc', Icon: Star24Regular },
  search: { cat: 'Misc', Icon: Search24Regular },
  globe: { cat: 'Misc', Icon: Globe24Regular },
};

const iconsByCategory = Object.entries(fluentIconsMap).reduce(
  (acc, [name, def]) => {
    if (!acc[def.cat]) acc[def.cat] = [];
    acc[def.cat].push({ name });
    return acc;
  },
  {} as Record<string, { name: string }[]>
);

const renderSimpleSvgToString = (element: any): string => {
  if (!element) return '';
  if (typeof element === 'string' || typeof element === 'number')
    return String(element);
  if (Array.isArray(element))
    return element.map(renderSimpleSvgToString).join('');

  const type = element.type;
  const props = element.props || {};

  if (typeof type === 'function') return renderSimpleSvgToString(type(props));
  if (type && typeof type === 'object' && typeof type.render === 'function')
    return renderSimpleSvgToString(type.render(props, null));
  if (typeof type === 'symbol') return renderSimpleSvgToString(props.children);
  if (typeof type !== 'string') return '';

  let attrStr = '';
  let childrenStr = '';

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') childrenStr = renderSimpleSvgToString(value);
    else if (key === 'style' && typeof value === 'object' && value) {
      const styleStr = Object.entries(value)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
        .join(';');
      attrStr += ` style="${styleStr}"`;
    } else if (key === 'className') attrStr += ` class="${value}"`;
    else if (key !== 'ref' && key !== 'key' && value !== undefined) {
      const attrName =
        key === 'viewBox'
          ? 'viewBox'
          : key.replace(/([A-Z])/g, '-$1').toLowerCase();
      attrStr += ` ${attrName}="${String(value).replace(/"/g, '&quot;')}"`;
    }
  }
  return `<${type}${attrStr}>${childrenStr}</${type}>`;
};

const renderSimpleSvgToStringLocal = (element: any): string =>
  renderSimpleSvgToString(element);

const makeDefault = (): GraphState => {
  return {
    groups: [
      {
        id: uid(),
        type: 'lane',
        parentId: null,
        name: 'Swimlane 1',
        x: 200,
        y: 100,
        width: DEFAULT_LANE_W,
        height: DEFAULT_LANE_H,
      },
    ],
    nodes: [],
    edges: [],
    layoutSpacing: 60,
  };
};

// ============= Auto Layout (2D Region Based) =============
function autoLayout(
  groups: GroupData[],
  nodes: NodeData[],
  edges: EdgeData[],
  spacing: number
) {
  const HEADER_H = 80;
  let newGroups = [...groups.map((g) => ({ ...g }))];
  let newNodes = [...nodes.map((n) => ({ ...n }))];

  // 1. Layout nodes inside each Lane
  newGroups
    .filter((g) => g.type === 'lane')
    .forEach((lane) => {
      const lNodes = newNodes.filter((n) => n.lane === lane.id);
      if (lNodes.length === 0) return;

      lNodes.sort((a, b) => a.y - b.y);
      const totalH =
        lNodes.reduce((sum, n) => sum + getNodeHeight(n), 0) +
        (lNodes.length - 1) * spacing;

      const cx = lane.x + lane.width / 2;
      let cy = lane.y + HEADER_H + 40;

      lNodes.forEach((n) => {
        n.x = cx - NODE_W / 2;
        n.y = cy;
        cy += getNodeHeight(n) + spacing;
      });

      lane.height = Math.max(DEFAULT_LANE_H, cy - lane.y + 40);
    });

  // 2. Layout Lanes inside each Pool
  newGroups
    .filter((g) => g.type === 'pool')
    .forEach((pool) => {
      const pLanes = newGroups.filter((l) => l.parentId === pool.id);
      if (pLanes.length === 0) return;

      pLanes.sort((a, b) => a.x - b.x);
      let currentX = pool.x + 40;
      let maxH = 200;

      pLanes.forEach((l) => {
        const dx = currentX - l.x;
        const dy = pool.y + HEADER_H - l.y;

        l.x += dx;
        l.y += dy;

        newNodes
          .filter((n) => n.lane === l.id)
          .forEach((n) => {
            n.x += dx;
            n.y += dy;
          });

        maxH = Math.max(maxH, l.height);
        currentX += l.width + 20;
      });

      pool.width = Math.max(400, currentX - pool.x + 20);
      pool.height = Math.max(300, maxH + HEADER_H + 40);
    });

  return { newGroups, newNodes };
}

// ============= Edge Routing =============
function routeEdge(
  from: { x: number; y: number; w: number; h: number },
  to: { x: number; y: number; w: number; h: number },
  idx = 0,
  total = 1
) {
  if (!from || !to) return { d: '', mid: null };

  const fcx = from.x + from.w / 2;
  const fcy = from.y + from.h / 2;
  const tcx = to.x + to.w / 2;
  const tcy = to.y + to.h / 2;

  const dx = tcx - fcx;
  const dy = tcy - fcy;
  const horizontal = Math.abs(dx) > Math.abs(dy);

  let fromSide: 'top' | 'bottom' | 'left' | 'right';
  let toSide: 'top' | 'bottom' | 'left' | 'right';
  if (horizontal) {
    fromSide = dx > 0 ? 'right' : 'left';
    toSide = dx > 0 ? 'left' : 'right';
  } else {
    fromSide = dy > 0 ? 'bottom' : 'top';
    toSide = dy > 0 ? 'top' : 'bottom';
  }

  const offset = (idx - (total - 1) / 2) * 12;

  const exit = anchorOf(from, fromSide, offset, horizontal);
  const entry = anchorOf(to, toSide, offset, horizontal);

  const r = 8;
  let d = '';
  let labelX, labelY;

  if (fromSide === 'bottom' && toSide === 'top') {
    const midY = (exit.y + entry.y) / 2;
    if (Math.abs(exit.x - entry.x) < 1)
      d = `M ${exit.x} ${exit.y} L ${entry.x} ${entry.y}`;
    else {
      const dir = entry.x > exit.x ? 1 : -1;
      d = `M ${exit.x} ${exit.y} L ${exit.x} ${midY - r} Q ${exit.x} ${midY} ${
        exit.x + dir * r
      } ${midY} L ${entry.x - dir * r} ${midY} Q ${entry.x} ${midY} ${
        entry.x
      } ${midY + r} L ${entry.x} ${entry.y}`;
    }
    labelX = (exit.x + entry.x) / 2;
    labelY = midY;
  } else if (fromSide === 'top' && toSide === 'bottom') {
    const dir = entry.x > exit.x ? 1 : -1;
    const sideX = exit.x + dir * (from.w / 2 + 24 + idx * 8);
    d = `M ${exit.x} ${exit.y} L ${exit.x} ${exit.y - 12} Q ${exit.x} ${
      exit.y - 12 - r
    } ${exit.x + dir * r} ${exit.y - 12 - r} L ${sideX - dir * r} ${
      exit.y - 12 - r
    } Q ${sideX} ${exit.y - 12 - r} ${sideX} ${
      exit.y - 12 - 2 * r
    } L ${sideX} ${entry.y + 12 + 2 * r} Q ${sideX} ${entry.y + 12 + r} ${
      sideX - dir * r
    } ${entry.y + 12 + r} L ${entry.x + dir * r} ${entry.y + 12 + r} Q ${
      entry.x
    } ${entry.y + 12 + r} ${entry.x} ${entry.y + 12} L ${entry.x} ${entry.y}`;
    labelX = sideX;
    labelY = (exit.y + entry.y) / 2;
  } else if (
    (fromSide === 'right' && toSide === 'left') ||
    (fromSide === 'left' && toSide === 'right')
  ) {
    const midX = (exit.x + entry.x) / 2;
    if (Math.abs(exit.y - entry.y) < 1)
      d = `M ${exit.x} ${exit.y} L ${entry.x} ${entry.y}`;
    else {
      const dir = entry.y > exit.y ? 1 : -1;
      const hdir = entry.x > exit.x ? 1 : -1;
      d = `M ${exit.x} ${exit.y} L ${midX - hdir * r} ${exit.y} Q ${midX} ${
        exit.y
      } ${midX} ${exit.y + dir * r} L ${midX} ${entry.y - dir * r} Q ${midX} ${
        entry.y
      } ${midX + hdir * r} ${entry.y} L ${entry.x} ${entry.y}`;
    }
    labelX = midX;
    labelY = (exit.y + entry.y) / 2;
  } else {
    d = `M ${exit.x} ${exit.y} L ${entry.x} ${exit.y} L ${entry.x} ${entry.y}`;
    labelX = entry.x;
    labelY = exit.y;
  }

  return { d, mid: { x: labelX, y: labelY } };
}

function anchorOf(
  box: { x: number; y: number; w: number; h: number },
  side: string,
  offset = 0,
  isHorizontalEdge = false
) {
  switch (side) {
    case 'top':
      return {
        x: box.x + box.w / 2 + (isHorizontalEdge ? 0 : offset),
        y: box.y,
      };
    case 'bottom':
      return {
        x: box.x + box.w / 2 + (isHorizontalEdge ? 0 : offset),
        y: box.y + box.h,
      };
    case 'left':
      return {
        x: box.x,
        y: box.y + box.h / 2 + (isHorizontalEdge ? offset : 0),
      };
    case 'right':
      return {
        x: box.x + box.w,
        y: box.y + box.h / 2 + (isHorizontalEdge ? offset : 0),
      };
    default:
      return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }
}

// ============= Templates =============
const templates: Record<
  string,
  { name: string; description: string; build: () => GraphState }
> = {
  blank: {
    name: 'Blank canvas',
    description: 'Start from scratch with one empty swimlane.',
    build: makeDefault,
  },
  simpleFlowchart: {
    name: 'Simple Flowchart',
    description: 'A basic flowchart without swimlanes.',
    build: () => {
      const nodes: NodeData[] = [
        {
          id: uid(),
          lane: null,
          label: 'Start',
          shape: 'start',
          x: 400,
          y: 100,
        },
        {
          id: uid(),
          lane: null,
          label: 'Process step',
          shape: 'process',
          x: 400,
          y: 250,
        },
        {
          id: uid(),
          lane: null,
          label: 'Decision?',
          shape: 'decision',
          x: 400,
          y: 400,
        },
        { id: uid(), lane: null, label: 'End', shape: 'end', x: 400, y: 550 },
      ];
      const edges: EdgeData[] = [
        { id: uid(), from: nodes[0].id, to: nodes[1].id },
        { id: uid(), from: nodes[1].id, to: nodes[2].id },
        { id: uid(), from: nodes[2].id, to: nodes[3].id, label: 'YES' },
      ];
      return { groups: [], nodes, edges, layoutSpacing: 60 };
    },
  },
  c4Context: {
    name: 'C4 System Context',
    description: 'Model users and external system dependencies.',
    build: () => {
      const pId = uid();
      const groups: GroupData[] = [
        {
          id: pId,
          type: 'pool',
          parentId: null,
          name: 'C4 Context Architecture',
          x: 50,
          y: 50,
          width: 1050,
          height: 600,
        },
        {
          id: uid(),
          type: 'lane',
          parentId: pId,
          name: 'Users',
          x: 100,
          y: 150,
          width: 280,
          height: 400,
        },
        {
          id: uid(),
          type: 'lane',
          parentId: pId,
          name: 'Core System',
          x: 400,
          y: 150,
          width: 280,
          height: 400,
        },
        {
          id: uid(),
          type: 'lane',
          parentId: pId,
          name: 'External Systems',
          x: 700,
          y: 150,
          width: 320,
          height: 400,
        },
      ];
      const nodes: NodeData[] = [
        {
          id: uid(),
          lane: groups[1].id,
          label: 'Customer',
          shape: 'start',
          x: 154,
          y: 250,
          icon: 'person',
        },
        {
          id: uid(),
          lane: groups[1].id,
          label: 'Admin Staff',
          shape: 'start',
          x: 154,
          y: 380,
          icon: 'team',
        },
        {
          id: uid(),
          lane: groups[2].id,
          label: 'E-Commerce Platform',
          shape: 'process',
          x: 454,
          y: 300,
          icon: 'desktop',
          mediaLayout: 'top',
        },
        {
          id: uid(),
          lane: groups[3].id,
          label: 'Payment Gateway',
          shape: 'draft',
          x: 774,
          y: 200,
          icon: 'money',
        },
        {
          id: uid(),
          lane: groups[3].id,
          label: 'Fulfillment API',
          shape: 'draft',
          x: 774,
          y: 320,
          icon: 'truck',
        },
        {
          id: uid(),
          lane: groups[3].id,
          label: 'Email Provider',
          shape: 'draft',
          x: 774,
          y: 440,
          icon: 'mail',
        },
      ];
      const edges: EdgeData[] = [
        {
          id: uid(),
          from: nodes[0].id,
          to: nodes[2].id,
          label: 'Browses & Buys',
        },
        {
          id: uid(),
          from: nodes[1].id,
          to: nodes[2].id,
          label: 'Manages catalog',
        },
        {
          id: uid(),
          from: nodes[2].id,
          to: nodes[3].id,
          label: 'Charges cards',
        },
        {
          id: uid(),
          from: nodes[2].id,
          to: nodes[4].id,
          label: 'Sends orders',
        },
        {
          id: uid(),
          from: nodes[2].id,
          to: nodes[5].id,
          label: 'Sends receipts',
        },
      ];
      return { groups, nodes, edges, layoutSpacing: 60 };
    },
  },
  agileSprint: {
    name: 'Scrum Sprint Lifecycle',
    description: 'Agile workflow from backlog to retrospective.',
    build: () => {
      const groups: GroupData[] = [
        {
          id: uid(),
          type: 'lane',
          parentId: null,
          name: 'Product Owner',
          x: 100,
          y: 100,
          width: 280,
          height: 750,
        },
        {
          id: uid(),
          type: 'lane',
          parentId: null,
          name: 'Scrum Master',
          x: 400,
          y: 100,
          width: 280,
          height: 750,
        },
        {
          id: uid(),
          type: 'lane',
          parentId: null,
          name: 'Dev Team',
          x: 700,
          y: 100,
          width: 280,
          height: 750,
        },
      ];
      const nodes: NodeData[] = [
        {
          id: uid(),
          lane: groups[0].id,
          label: 'Product Backlog Refinement',
          shape: 'start',
          x: 154,
          y: 180,
          icon: 'folder',
        },
        {
          id: uid(),
          lane: groups[1].id,
          label: 'Sprint Planning',
          shape: 'process',
          x: 454,
          y: 280,
          icon: 'calendar',
        },
        {
          id: uid(),
          lane: groups[2].id,
          label: 'Sprint Backlog Committed',
          shape: 'process',
          x: 754,
          y: 380,
          icon: 'checkmark',
        },
        {
          id: uid(),
          lane: groups[2].id,
          label: 'Daily Standup',
          shape: 'process',
          x: 754,
          y: 480,
          icon: 'sync',
        },
        {
          id: uid(),
          lane: groups[2].id,
          label: 'Development & Testing',
          shape: 'process',
          x: 754,
          y: 580,
          icon: 'code',
        },
        {
          id: uid(),
          lane: groups[2].id,
          label: 'Sprint Goal Met?',
          shape: 'decision',
          x: 754,
          y: 680,
          icon: 'target',
        },
        {
          id: uid(),
          lane: groups[1].id,
          label: 'Sprint Review',
          shape: 'process',
          x: 454,
          y: 780,
          icon: 'team',
        },
        {
          id: uid(),
          lane: groups[0].id,
          label: 'Accept Increment',
          shape: 'end',
          x: 154,
          y: 880,
          icon: 'thumbUp',
        },
        {
          id: uid(),
          lane: groups[1].id,
          label: 'Sprint Retrospective',
          shape: 'process',
          x: 454,
          y: 880,
          icon: 'chat',
        },
      ];
      const edges: EdgeData[] = [
        { id: uid(), from: nodes[0].id, to: nodes[1].id },
        { id: uid(), from: nodes[1].id, to: nodes[2].id },
        { id: uid(), from: nodes[2].id, to: nodes[3].id },
        { id: uid(), from: nodes[3].id, to: nodes[4].id },
        { id: uid(), from: nodes[4].id, to: nodes[5].id },
        { id: uid(), from: nodes[5].id, to: nodes[6].id, label: 'YES' },
        { id: uid(), from: nodes[5].id, to: nodes[3].id, label: 'NO' },
        { id: uid(), from: nodes[6].id, to: nodes[7].id },
        { id: uid(), from: nodes[7].id, to: nodes[8].id },
        { id: uid(), from: nodes[8].id, to: nodes[0].id, label: 'Next Sprint' },
      ];
      return { groups, nodes, edges, layoutSpacing: 60 };
    },
  },
};

// ============= Subcomponents =============
const GroupContainer = ({
  group,
  selected,
  onSelect,
  onChange,
  onDelete,
  onDragStart,
  onResizeStart,
  onStartConnect,
}: {
  group: GroupData;
  selected: boolean;
  onSelect: (id: string) => void;
  onChange: (g: GroupData) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: any, id: string) => void;
  onResizeStart: (e: any, id: string) => void;
  onStartConnect: (e: any, id: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(group.name);
  const [sub, setSub] = useState(group.subtitle || '');
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(group.name);
    setSub(group.subtitle || '');
  }, [group.name, group.subtitle]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const t = text.trim() || 'Untitled';
    const s = sub.trim();
    if (t !== group.name || s !== (group.subtitle || ''))
      onChange({ ...group, name: t, subtitle: s });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.currentTarget.parentElement?.contains(e.relatedTarget as Node))
      return;
    commit();
  };

  const isPool = group.type === 'pool';

  return (
    <div
      onMouseDown={(e) => {
        if (editing) return;
        e.stopPropagation();
        onSelect(group.id);
        onDragStart(e, group.id);
      }}
      onTouchStart={(e) => {
        if (editing) return;
        e.stopPropagation();
        onSelect(group.id);
        onDragStart(e, group.id);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
        background: isPool
          ? 'rgba(255,255,255,0.4)'
          : tokens.canvasLaneBackground,
        border: isPool
          ? `3px dashed ${tokens.neutralStroke2}`
          : `1px solid ${tokens.neutralStroke2}`,
        borderRadius: tokens.radiusLarge,
        boxShadow: selected
          ? tokens.shadow16
          : hovered && !isPool
          ? tokens.shadow4
          : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        borderColor: selected
          ? tokens.brandBackground
          : hovered
          ? tokens.neutralStroke1
          : tokens.neutralStroke2,
        boxSizing: 'border-box',
        zIndex: isPool ? 0 : 1,
        cursor: editing ? 'default' : 'grab',
      }}
    >
      {editing ? (
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: tokens.neutralBackground1,
            borderRadius: tokens.radiusLarge,
          }}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                inputRef.current?.nextElementSibling?.focus();
              }
              if (e.key === 'Escape') commit();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder={`${isPool ? 'Pool' : 'Swimlane'} title...`}
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: 20,
              fontWeight: 600,
              color: tokens.neutralForeground1,
              fontFamily: tokens.fontFamily,
              border: `2px solid ${tokens.brandBackground}`,
              borderRadius: tokens.radiusSmall,
              outline: 'none',
            }}
          />
          <input
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') commit();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Add an optional subtitle..."
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: 13,
              fontWeight: 400,
              color: tokens.neutralForeground2,
              fontFamily: tokens.fontFamily,
              border: `1px solid ${tokens.brandBackground}`,
              borderRadius: tokens.radiusSmall,
              outline: 'none',
            }}
          />
        </div>
      ) : (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            borderBottom: isPool
              ? 'none'
              : `1px solid ${tokens.neutralStroke2}`,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: isPool
                ? tokens.neutralForeground2
                : tokens.neutralForeground1,
              fontFamily: tokens.fontFamily,
            }}
          >
            {group.name}
          </div>
          {group.subtitle && (
            <div
              style={{
                fontSize: 13,
                color: tokens.neutralForeground3,
                marginTop: 4,
                fontFamily: tokens.fontFamily,
              }}
            >
              {group.subtitle}
            </div>
          )}
        </div>
      )}

      <div
        onMouseDown={(e) => onResizeStart(e, group.id)}
        onTouchStart={(e) => onResizeStart(e, group.id)}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 24,
          height: 24,
          cursor: 'nwse-resize',
          zIndex: 5,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M 16 20 L 20 16 L 20 20 Z M 10 20 L 20 10 L 20 13 L 13 20 Z"
            fill={tokens.neutralStroke1}
          />
        </svg>
      </div>

      {(hovered || selected) && !editing && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={hoverBtnStyle({
              top: -12,
              left: -12,
              color: tokens.neutralForeground2,
              width: 24,
              height: 24,
            })}
            title="Delete"
          >
            <Icon path={uiIcons.trash} size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={hoverBtnStyle({
              top: -12,
              left: 16,
              color: tokens.neutralForeground2,
              width: 24,
              height: 24,
            })}
            title="Edit title"
          >
            <Icon path={uiIcons.edit} size={12} />
          </button>
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnect(e, group.id);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onStartConnect(e, group.id);
            }}
            style={hoverBtnStyle({
              top: -14,
              right: 16,
              width: 28,
              height: 28,
              background: tokens.accent,
              color: '#fff',
              border: `2px solid ${tokens.neutralBackground1}`,
            })}
            title="Drag to connect"
          >
            <Icon path={uiIcons.add} size={14} />
          </button>
        </>
      )}
    </div>
  );
};

const GraphNode = ({
  node,
  selected,
  connecting,
  onSelect,
  onChange,
  onDelete,
  onDragStart,
  onStartConnect,
  onDuplicate,
  accent,
}: {
  node: NodeData;
  selected: boolean;
  connecting: boolean;
  onSelect: (id: string) => void;
  onChange: (n: NodeData) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: any, id: string) => void;
  onStartConnect: (e: any, id: string) => void;
  onDuplicate: (id: string) => void;
  accent: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(node.label);
  const [hovered, setHovered] = useState(false);
  useEffect(() => setText(node.label), [node.label]);

  let border = `1px solid ${tokens.neutralStroke1}`;
  let radius = tokens.radiusLarge;
  let fontWeight = 400;
  let borderTop = border;

  if (node.shape === 'start') {
    radius = tokens.radiusCircular;
    fontWeight = 600;
    border = `2px solid ${tokens.neutralStroke1}`;
    borderTop = border;
  } else if (node.shape === 'end') {
    radius = tokens.radiusMedium;
    fontWeight = 600;
    border = `2px solid ${tokens.neutralStroke1}`;
    borderTop = border;
  } else if (node.shape === 'decision') {
    radius = tokens.radiusXLarge;
  } else if (node.shape === 'draft') {
    border = `2px dashed ${tokens.neutralStroke1}`;
    borderTop = border;
  } else if (node.shape === 'database') {
    borderTop = `6px solid ${tokens.neutralStroke1}`;
  }

  const commit = () => {
    setEditing(false);
    if (text.trim() && text !== node.label)
      onChange({ ...node, label: text.trim() });
    else setText(node.label);
  };

  const showHandles = (hovered || selected) && !editing;
  const hasMedia = !!(node.icon || node.image);
  const isTopLayout = hasMedia && node.mediaLayout === 'top';
  const h = getNodeHeight(node);
  const IconCmp = node.icon && fluentIconsMap[node.icon]?.Icon;

  return (
    <div
      onMouseDown={(e) => {
        if (editing) return;
        e.stopPropagation();
        if (e.shiftKey || e.button === 2) return;
        onSelect(node.id);
        onDragStart(e, node.id);
      }}
      onTouchStart={(e) => {
        if (editing) return;
        e.stopPropagation();
        onSelect(node.id);
        onDragStart(e, node.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: NODE_W,
        height: h,
        background: tokens.neutralBackground1,
        border,
        borderTop,
        borderRadius: radius,
        boxShadow: selected
          ? `0 0 0 2px ${accent}, ${tokens.shadow16}`
          : hovered
          ? tokens.shadow16
          : tokens.shadow4,
        display: 'flex',
        flexDirection: isTopLayout ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: hasMedia && !isTopLayout ? 'flex-start' : 'center',
        padding: isTopLayout ? 0 : hasMedia ? '0 12px 0 8px' : '0 12px',
        gap: isTopLayout ? 0 : hasMedia ? 10 : 0,
        textAlign: isTopLayout ? 'center' : hasMedia ? 'left' : 'center',
        fontSize: 13,
        lineHeight: 1.25,
        fontWeight,
        color: tokens.neutralForeground1,
        cursor: editing ? 'text' : 'grab',
        transition: 'box-shadow 0.2s, transform 0.1s',
        transform: hovered && !selected ? 'translateY(-2px)' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        boxSizing: 'border-box',
        zIndex: selected ? 4 : 3,
      }}
    >
      {hasMedia && isTopLayout && (
        <div
          style={{
            width: '100%',
            height: node.image && node.imageFit === 'cover' ? 172 : 100,
            borderBottom: `1px solid ${tokens.neutralStroke2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderTopLeftRadius:
              radius === tokens.radiusCircular ? NODE_W / 2 : radius,
            borderTopRightRadius:
              radius === tokens.radiusCircular ? NODE_W / 2 : radius,
            background: node.image
              ? tokens.neutralBackground1
              : `${tokens.brandBackground}1a`,
          }}
        >
          {node.image ? (
            <img
              src={node.image}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: node.imageFit || 'cover',
                pointerEvents: 'none',
              }}
            />
          ) : IconCmp ? (
            <IconCmp
              primaryFill={tokens.brandBackground}
              style={{ width: 48, height: 48 }}
            />
          ) : null}
        </div>
      )}
      {hasMedia && !isTopLayout && (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: tokens.radiusLarge,
            background: node.image
              ? tokens.neutralBackground1
              : `${tokens.brandBackground}1a`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.brandBackground,
            flexShrink: 0,
            overflow: 'hidden',
            border: node.image ? `1px solid ${tokens.neutralStroke2}` : 'none',
          }}
        >
          {node.image ? (
            <img
              src={node.image}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: node.imageFit || 'cover',
                pointerEvents: 'none',
              }}
            />
          ) : IconCmp ? (
            <IconCmp
              primaryFill={tokens.brandBackground}
              style={{ width: 22, height: 22 }}
            />
          ) : null}
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isTopLayout ? 'center' : 'flex-start',
          width: '100%',
          height: isTopLayout ? 40 : 'auto',
          padding: isTopLayout ? '0 8px' : 0,
        }}
      >
        {editing ? (
          <textarea
            autoFocus
            onFocus={(e) => e.target.select()}
            spellCheck={true}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                setText(node.label);
                setEditing(false);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              textAlign: isTopLayout ? 'center' : hasMedia ? 'left' : 'center',
              fontSize: 13,
              fontFamily: tokens.fontFamily,
              fontWeight,
              color: tokens.neutralForeground1,
              padding: isTopLayout ? '8px 4px' : '4px',
              minWidth: 0,
            }}
          />
        ) : (
          <span
            style={{
              pointerEvents: 'none',
              width: '100%',
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {node.label}
          </span>
        )}
      </div>

      {showHandles && (
        <div style={{ animation: 'fadeIn 0.15s ease-out' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={hoverBtnStyle({
              top: -12,
              right: -12,
              color: tokens.neutralForeground2,
              width: 24,
              height: 24,
            })}
            title="Delete"
          >
            <Icon path={uiIcons.trash} size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(node.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={hoverBtnStyle({
              top: -12,
              right: 16,
              color: tokens.neutralForeground2,
              width: 24,
              height: 24,
            })}
            title="Duplicate"
          >
            <Icon path={uiIcons.copy} size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={hoverBtnStyle({
              top: -12,
              right: 44,
              color: tokens.neutralForeground2,
              width: 24,
              height: 24,
            })}
            title="Edit text"
          >
            <Icon path={uiIcons.edit} size={12} />
          </button>
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartConnect(e, node.id);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onStartConnect(e, node.id);
            }}
            style={hoverBtnStyle({
              bottom: -14,
              left: NODE_W / 2 - 14,
              width: 28,
              height: 28,
              background: tokens.accent,
              color: '#fff',
              border: `2px solid ${tokens.neutralBackground1}`,
            })}
            title="Drag to connect"
          >
            <Icon path={uiIcons.add} size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

const hoverBtnStyle = (extra = {}): React.CSSProperties => ({
  position: 'absolute',
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: tokens.neutralBackground1,
  border: `1px solid ${tokens.neutralStroke1}`,
  color: tokens.neutralForeground2,
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: tokens.shadow4,
  zIndex: 4,
  ...extra,
});

const EdgeLine = ({
  edge,
  fromRect,
  toRect,
  idx,
  total,
  style,
  selected,
  onSelect,
  onMid,
}: {
  edge: EdgeData;
  fromRect: { x: number; y: number; w: number; h: number };
  toRect: { x: number; y: number; w: number; h: number };
  idx: number;
  total: number;
  style: EdgeStyle;
  selected: boolean;
  onSelect: (id: string) => void;
  onMid: (id: string, mid: { x: number; y: number }) => void;
}) => {
  const { d, mid } = useMemo(
    () => routeEdge(fromRect, toRect, idx, total),
    [fromRect, toRect, idx, total]
  );
  useEffect(() => {
    if (mid && edge.label) onMid(edge.id, mid);
  }, [mid?.x, mid?.y, edge.label, edge.id, onMid, mid]);
  if (!d) return null;

  const gradId = `grad-${edge.id}`;
  const markerId = `arrow-${edge.id}`;
  const isGradient = style.type === 'gradient';
  const stroke = isGradient ? `url(#${gradId})` : style.color;
  const arrowColor = isGradient ? style.color2 || style.color : style.color;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect(edge.id);
      }}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        {isGradient && (
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={fromRect.x}
            y1={fromRect.y}
            x2={toRect.x}
            y2={toRect.y}
          >
            <stop offset="0%" stopColor={style.color} />
            <stop offset="100%" stopColor={style.color2 || style.color} />
          </linearGradient>
        )}
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
        </marker>
      </defs>
      <path d={d} stroke="transparent" strokeWidth={14} fill="none" />
      <path
        d={d}
        stroke={stroke}
        strokeWidth={selected ? style.width + 1 : style.width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={
          style.dash === 'dashed'
            ? '6 4'
            : style.dash === 'dotted'
            ? '2 4'
            : 'none'
        }
        markerEnd={`url(#${markerId})`}
        style={{
          filter: selected
            ? `drop-shadow(0 0 4px ${tokens.brandBackground})`
            : 'none',
        }}
      />
    </g>
  );
};

const EdgeLabel = ({
  edge,
  pos,
  style,
}: {
  edge: EdgeData;
  pos: { x: number; y: number };
  style: EdgeStyle;
}) => {
  if (!pos || !edge.label) return null;
  const isGradient = style.type === 'gradient';
  const arrowColor = isGradient ? style.color2 || style.color : style.color;
  const w = edge.label.length * 7.5 + 18;
  const h = 22;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={pos.x - w / 2 - 3}
        y={pos.y - h / 2 - 3}
        width={w + 6}
        height={h + 6}
        rx={7}
        fill={tokens.neutralBackground2}
      />
      <rect
        x={pos.x - w / 2}
        y={pos.y - h / 2}
        width={w}
        height={h}
        rx={5}
        fill={tokens.neutralBackground1}
        stroke={arrowColor}
        strokeWidth={1}
      />
      <text
        x={pos.x}
        y={pos.y + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill={arrowColor}
        fontFamily={tokens.fontFamily}
        letterSpacing="0.02em"
      >
        {edge.label}
      </text>
    </g>
  );
};

// ============= Sidebar Elements =============

const Label = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 600,
      color: tokens.neutralForeground2,
      marginBottom: 6,
      marginTop: 8,
      fontFamily: tokens.fontFamily,
    }}
  >
    {children}
  </div>
);

const ColorRow = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 36,
        height: 32,
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',
      }}
    />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        padding: '6px 8px',
        fontSize: 12,
        border: `1px solid ${tokens.neutralStroke1}`,
        borderRadius: tokens.radiusMedium,
        fontFamily: tokens.fontFamily,
        minWidth: 0,
      }}
    />
  </div>
);

const Slider = ({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', height: 28, marginBottom: 4 }}>
      <div
        style={{
          position: 'absolute',
          top: 11,
          left: 0,
          right: 0,
          height: 6,
          background: tokens.neutralBackground4,
          borderRadius: tokens.radiusCircular,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 11,
          left: 0,
          height: 6,
          width: `${pct}%`,
          background: tokens.brandBackground,
          borderRadius: tokens.radiusCircular,
          pointerEvents: 'none',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          opacity: 0,
          cursor: 'pointer',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `calc(${pct}% - 9px)`,
          top: 5,
          width: 18,
          height: 18,
          background: tokens.neutralBackground1,
          border: `2px solid ${tokens.brandBackground}`,
          borderRadius: '50%',
          boxShadow: tokens.shadow4,
          pointerEvents: 'none',
          transition: 'transform 0.1s',
        }}
      />
    </div>
  );
};

const Section = ({ open, setOpen, id, title, icon, children }: any) => (
  <div style={{ borderBottom: `1px solid ${tokens.neutralStroke2}` }}>
    <button
      onClick={() => setOpen(open === id ? null : id)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
        color: tokens.neutralForeground1,
        fontFamily: tokens.fontFamily,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon path={icon} size={16} style={{ color: tokens.brandForeground }} />
        {title}
      </span>
      <Icon
        path={uiIcons.chevron}
        size={14}
        style={{
          transform: open === id ? 'rotate(0)' : 'rotate(-90deg)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
    {open === id && (
      <div
        style={{ padding: '4px 16px 16px', animation: 'fadeIn 0.2s ease-out' }}
      >
        {children}
      </div>
    )}
  </div>
);

const pillBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '6px 8px',
  fontSize: 12,
  background: active ? tokens.brandBackground : tokens.neutralBackground1,
  color: active ? '#fff' : tokens.neutralForeground1,
  border: `1px solid ${
    active ? tokens.brandBackground : tokens.neutralStroke1
  }`,
  borderRadius: tokens.radiusMedium,
  cursor: 'pointer',
  fontFamily: tokens.fontFamily,
  fontWeight: 500,
  textTransform: 'capitalize',
});

const exportBtnStyle = (): React.CSSProperties => ({
  flex: 1,
  padding: '10px 8px',
  background: tokens.neutralBackground1,
  color: tokens.neutralForeground1,
  border: `1px solid ${tokens.neutralStroke1}`,
  borderRadius: tokens.radiusMedium,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: tokens.fontFamily,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'background 0.15s, border-color 0.15s',
});

const IconPicker = ({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (name: string | null) => void;
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return iconsByCategory;
    const q = search.toLowerCase();
    const out: Record<string, { name: string }[]> = {};
    Object.entries(iconsByCategory).forEach(([cat, items]) => {
      const matches = items.filter((i) => i.name.toLowerCase().includes(q));
      if (matches.length) out[cat] = matches;
    });
    return out;
  }, [search]);

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search icons..."
        style={{
          width: '100%',
          padding: '6px 10px',
          fontSize: 12,
          border: `1px solid ${tokens.neutralStroke1}`,
          borderRadius: tokens.radiusMedium,
          fontFamily: tokens.fontFamily,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 8,
        }}
        onFocus={(e) => (e.target.style.borderColor = tokens.brandBackground)}
        onBlur={(e) => (e.target.style.borderColor = tokens.neutralStroke1)}
      />
      <div
        style={{
          maxHeight: 280,
          overflowY: 'auto',
          border: `1px solid ${tokens.neutralStroke2}`,
          borderRadius: tokens.radiusMedium,
          padding: 8,
        }}
      >
        {Object.keys(filtered).length === 0 && (
          <div
            style={{
              fontSize: 11,
              color: tokens.neutralForeground3,
              textAlign: 'center',
              padding: 12,
            }}
          >
            No icons match "{search}"
          </div>
        )}
        {Object.entries(filtered).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: tokens.neutralForeground3,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}
            >
              {cat}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 4,
              }}
            >
              {items.map((item) => {
                const IconCmp = fluentIconsMap[item.name]?.Icon;
                if (!IconCmp) return null;
                return (
                  <button
                    key={item.name}
                    onClick={() =>
                      onChange(value === item.name ? null : item.name)
                    }
                    title={item.name}
                    style={{
                      aspectRatio: '1',
                      padding: 0,
                      background:
                        value === item.name
                          ? `${tokens.brandBackground}22`
                          : tokens.neutralBackground1,
                      border: `1px solid ${
                        value === item.name
                          ? tokens.brandBackground
                          : tokens.neutralStroke2
                      }`,
                      borderRadius: tokens.radiusSmall,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color:
                        value === item.name
                          ? tokens.brandBackground
                          : tokens.neutralForeground2,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== item.name) {
                        e.currentTarget.style.background =
                          tokens.neutralBackground3;
                        e.currentTarget.style.borderColor =
                          tokens.brandBackground;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (value !== item.name) {
                        e.currentTarget.style.background =
                          tokens.neutralBackground1;
                        e.currentTarget.style.borderColor =
                          tokens.neutralStroke2;
                      }
                    }}
                  >
                    <IconCmp
                      primaryFill="currentColor"
                      style={{ width: 18, height: 18 }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SidebarProps {
  lanes: Lane[];
  nodes: NodeData[];
  edges: EdgeData[];
  selected: string | null;
  selectedEdge: string | null;
  onAddNode: (laneId: string | null, shape: ShapeType) => void;
  onAddLane: () => void;
  onRenameLane: (id: string, name: string, subtitle?: string) => void;
  onDeleteLane: (id: string) => void;
  onReorderLane: (id: string, index: number) => void;
  edgeStyle: EdgeStyle;
  setEdgeStyle: (style: EdgeStyle) => void;
  onUpdateEdge: (id: string, patch: Partial<EdgeData>) => void;
  onUpdateNode: (node: NodeData) => void;
  onAutoArrange: () => void;
  onReset: () => void;
  laneGap: number;
  setLaneGap: (gap: number) => void;
  layoutSpacing: number;
  setLayoutSpacing: (spacing: number) => void;
  onDownloadSVG: () => void;
  onDownloadPNG: () => void;
  onDownloadJSON: () => void;
  onLoadJSON: () => void;
  onLoadTemplate: (key: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDuplicate: () => void;
  toast: (msg: string, kind?: string) => void;
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({
  lanes,
  nodes,
  edges,
  selected,
  selectedEdge,
  onAddNode,
  onAddLane,
  onRenameLane,
  onDeleteLane,
  onReorderLane,
  edgeStyle,
  setEdgeStyle,
  onUpdateEdge,
  onUpdateNode,
  onAutoArrange,
  onReset,
  laneGap,
  setLaneGap,
  layoutSpacing,
  setLayoutSpacing,
  onDownloadSVG,
  onDownloadPNG,
  onDownloadJSON,
  onLoadJSON,
  onLoadTemplate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDuplicate,
  toast,
  isMobile,
  open,
  onClose,
}: SidebarProps) => {
  const [openSection, setOpenSection] = useState<string | null>('add');
  const [draggingLane, setDraggingLane] = useState<string | null>(null);

  useEffect(() => {
    if (selected) setOpenSection('nodeprops');
  }, [selected]);
  useEffect(() => {
    if (selectedEdge) setOpenSection('edgeprops');
  }, [selectedEdge]);

  const selectedEdgeObj = edges.find((e) => e.id === selectedEdge);

  const drawerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'min(320px, 88vw)',
        background: tokens.neutralBackground1,
        borderRight: `1px solid ${tokens.neutralStroke2}`,
        boxShadow: tokens.shadow28,
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: tokens.fontFamily,
        zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.33, 0, 0, 1)',
        WebkitOverflowScrolling: 'touch',
      }
    : {
        width: 300,
        background: tokens.neutralBackground1,
        borderRight: `1px solid ${tokens.neutralStroke2}`,
        boxShadow: tokens.shadow8,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: tokens.fontFamily,
        flexShrink: 0,
        zIndex: 2,
      };

  const AddNodeButtons = ({ targetLane }: { targetLane: string | null }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
      {[
        {
          shape: 'process',
          label: 'Process',
          radius: tokens.radiusLarge,
          border: `1px solid ${tokens.neutralStroke1}`,
          fw: 400,
        },
        {
          shape: 'decision',
          label: 'Decision',
          radius: tokens.radiusXLarge,
          border: `1px solid ${tokens.neutralStroke1}`,
          fw: 400,
        },
        {
          shape: 'start',
          label: 'Start',
          radius: tokens.radiusCircular,
          border: `2px solid ${tokens.neutralStroke1}`,
          fw: 600,
        },
        {
          shape: 'end',
          label: 'End',
          radius: tokens.radiusMedium,
          border: `2px solid ${tokens.neutralStroke1}`,
          fw: 600,
        },
        {
          shape: 'database',
          label: 'Database',
          radius: tokens.radiusLarge,
          border: `1px solid ${tokens.neutralStroke1}`,
          borderTop: `6px solid ${tokens.neutralStroke1}`,
          fw: 400,
        },
        {
          shape: 'draft',
          label: 'External',
          radius: tokens.radiusLarge,
          border: `2px dashed ${tokens.neutralStroke1}`,
          fw: 400,
        },
      ].map((s) => (
        <button
          key={s.shape}
          onClick={() => onAddNode(targetLane, s.shape as ShapeType)}
          style={{
            padding: '6px',
            fontSize: 11,
            background: tokens.neutralBackground1,
            border: s.border,
            borderTop: s.borderTop || s.border,
            borderRadius: s.radius,
            cursor: 'pointer',
            fontFamily: tokens.fontFamily,
            color: tokens.neutralForeground1,
            fontWeight: s.fw,
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {isMobile && open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
            animation: 'fadeIn 0.2s',
          }}
        />
      )}
      <aside style={drawerStyle}>
        <div
          style={{
            padding: '16px',
            borderBottom: `1px solid ${tokens.neutralStroke2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ff8300, #ff4700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
                boxShadow: tokens.shadow4,
              }}
            >
              Af
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: tokens.neutralForeground1,
                }}
              >
                Autoflow
              </div>
              <div style={{ fontSize: 12, color: tokens.neutralForeground3 }}>
                Architecture & Flow
              </div>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: tokens.radiusMedium,
                border: 'none',
                background: tokens.neutralBackground3,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.neutralForeground1,
              }}
            >
              <Icon path={uiIcons.close} size={18} />
            </button>
          )}
        </div>

        <div
          style={{
            padding: 12,
            borderBottom: `1px solid ${tokens.neutralStroke2}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              style={{
                flex: 1,
                padding: '8px',
                background: canUndo
                  ? tokens.neutralBackground1
                  : tokens.neutralBackground3,
                color: canUndo
                  ? tokens.neutralForeground1
                  : tokens.neutralForegroundDisabled,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderRadius: tokens.radiusMedium,
                fontSize: 12,
                fontWeight: 600,
                cursor: canUndo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon path={uiIcons.undo} size={14} /> Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              style={{
                flex: 1,
                padding: '8px',
                background: canRedo
                  ? tokens.neutralBackground1
                  : tokens.neutralBackground3,
                color: canRedo
                  ? tokens.neutralForeground1
                  : tokens.neutralForegroundDisabled,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderRadius: tokens.radiusMedium,
                fontSize: 12,
                fontWeight: 600,
                cursor: canRedo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon path={uiIcons.redo} size={14} /> Redo
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onAutoArrange}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: tokens.brandBackground,
                color: '#fff',
                border: 'none',
                borderRadius: tokens.radiusMedium,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon path={uiIcons.magic} size={14} /> Auto-arrange
            </button>
            <button
              onClick={onReset}
              style={{
                padding: '8px 12px',
                background: tokens.neutralBackground1,
                color: tokens.neutralForeground1,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderRadius: tokens.radiusMedium,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <Section
          open={openSection}
          setOpen={setOpenSection}
          id="templates"
          title="Templates"
          icon={uiIcons.template}
        >
          <div
            style={{
              fontSize: 11,
              color: tokens.neutralForeground3,
              marginBottom: 8,
            }}
          >
            Replaces your current diagram.
          </div>
          {Object.entries(templates).map(([key, t]) => (
            <button
              key={key}
              onClick={() => onLoadTemplate(key)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                marginBottom: 4,
                background: tokens.neutralBackground1,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderRadius: tokens.radiusMedium,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: tokens.neutralForeground1,
                  marginBottom: 2,
                }}
              >
                {t.name}
              </div>
              <div style={{ fontSize: 11, color: tokens.neutralForeground3 }}>
                {t.description}
              </div>
            </button>
          ))}
        </Section>

        <Section
          open={openSection}
          setOpen={setOpenSection}
          id="add"
          title="Add Element"
          icon={uiIcons.add}
        >
          <Label>Nodes</Label>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}
          >
            {[
              {
                shape: 'process',
                label: 'Process',
                radius: tokens.radiusLarge,
                border: `1px solid ${tokens.neutralStroke1}`,
                fw: 400,
              },
              {
                shape: 'decision',
                label: 'Decision',
                radius: tokens.radiusXLarge,
                border: `1px solid ${tokens.neutralStroke1}`,
                fw: 400,
              },
              {
                shape: 'start',
                label: 'Start',
                radius: tokens.radiusCircular,
                border: `2px solid ${tokens.neutralStroke1}`,
                fw: 600,
              },
              {
                shape: 'end',
                label: 'End',
                radius: tokens.radiusMedium,
                border: `2px solid ${tokens.neutralStroke1}`,
                fw: 600,
              },
              {
                shape: 'database',
                label: 'Database',
                radius: tokens.radiusLarge,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderTop: `6px solid ${tokens.neutralStroke1}`,
                fw: 400,
              },
              {
                shape: 'draft',
                label: 'External',
                radius: tokens.radiusLarge,
                border: `2px dashed ${tokens.neutralStroke1}`,
                fw: 400,
              },
            ].map((s) => (
              <button
                key={s.shape}
                onClick={() => onAddNode(null, s.shape as ShapeType)}
                style={{
                  padding: '6px',
                  fontSize: 11,
                  background: tokens.neutralBackground1,
                  border: s.border,
                  borderTop: s.borderTop || s.border,
                  borderRadius: s.radius,
                  cursor: 'pointer',
                  fontFamily: tokens.fontFamily,
                  color: tokens.neutralForeground1,
                  fontWeight: s.fw,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ height: 16 }} />
          <Label>Containers</Label>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}
          >
            <button
              onClick={() => onAddLane()}
              style={{
                padding: '8px',
                fontSize: 12,
                background: tokens.neutralBackground1,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderRadius: tokens.radiusMedium,
                cursor: 'pointer',
                fontWeight: 600,
                color: tokens.neutralForeground1,
              }}
            >
              Swimlane / Pool
            </button>
          </div>
        </Section>

        <Section
          open={openSection}
          setOpen={setOpenSection}
          id="lanes"
          title="Swimlanes"
          icon={uiIcons.swim}
        >
          <Label>Gap between lanes: {laneGap}px</Label>
          <div style={{ marginBottom: 12 }}>
            <Slider value={laneGap} min={0} max={80} onChange={setLaneGap} />
          </div>
          <div
            style={{
              fontSize: 11,
              color: tokens.neutralForeground3,
              marginBottom: 8,
            }}
          >
            Drag the grip to reorder.
          </div>
          {lanes.map((l, i) => (
            <div
              key={l.id}
              draggable
              onDragStart={() => setDraggingLane(l.id)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={() => {
                if (draggingLane && draggingLane !== l.id)
                  onReorderLane(draggingLane, i);
                setDraggingLane(null);
              }}
              onDragEnd={() => setDraggingLane(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: tokens.radiusMedium,
                background:
                  draggingLane === l.id
                    ? tokens.neutralBackground4
                    : tokens.neutralBackground3,
                marginBottom: 4,
                opacity: draggingLane === l.id ? 0.5 : 1,
                border: `1px solid transparent`,
                transition: 'background 0.15s',
              }}
            >
              <Icon
                path={uiIcons.grip}
                size={14}
                style={{ color: tokens.neutralForeground3, cursor: 'grab' }}
              />
              <input
                value={l.name}
                onChange={(e) => onRenameLane(l.id, e.target.value, l.subtitle)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: tokens.fontFamily,
                  color: tokens.neutralForeground1,
                  minWidth: 0,
                }}
              />
              <button
                onClick={() => onDeleteLane(l.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: tokens.neutralForeground2,
                  padding: 2,
                  display: 'flex',
                }}
              >
                <Icon path={uiIcons.trash} size={14} />
              </button>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={onAddLane}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: tokens.neutralBackground1,
                color: tokens.neutralForeground1,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderRadius: tokens.radiusMedium,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon path={uiIcons.add} size={14} /> Add swimlane
            </button>
          </div>
        </Section>

        <Section
          open={openSection}
          setOpen={setOpenSection}
          id="layout"
          title="Layout & Styling"
          icon={uiIcons.palette}
        >
          <Label>Node Spacing: {layoutSpacing}px</Label>
          <Slider
            value={layoutSpacing}
            min={20}
            max={150}
            onChange={(v) => setLayoutSpacing(v)}
          />
          <div
            style={{
              fontSize: 11,
              color: tokens.neutralForeground3,
              marginBottom: 16,
            }}
          >
            Spacing applied when clicking "Auto-arrange".
          </div>

          <Label>Line type</Label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['solid', 'gradient'].map((t) => (
              <button
                key={t}
                onClick={() => setEdgeStyle({ ...edgeStyle, type: t as any })}
                style={pillBtn(edgeStyle.type === t)}
              >
                {t}
              </button>
            ))}
          </div>
          <Label>Dash style</Label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['none', 'dashed', 'dotted'].map((t) => (
              <button
                key={t}
                onClick={() => setEdgeStyle({ ...edgeStyle, dash: t as any })}
                style={pillBtn(edgeStyle.dash === t)}
              >
                {t}
              </button>
            ))}
          </div>
          <Label>Primary color</Label>
          <ColorRow
            value={edgeStyle.color}
            onChange={(v) => setEdgeStyle({ ...edgeStyle, color: v })}
          />
          {edgeStyle.type === 'gradient' && (
            <>
              <Label>Gradient end color</Label>
              <ColorRow
                value={edgeStyle.color2 || '#ff4700'}
                onChange={(v) => setEdgeStyle({ ...edgeStyle, color2: v })}
              />
            </>
          )}
          <Label>Stroke width: {edgeStyle.width}px</Label>
          <Slider
            value={edgeStyle.width}
            min={1}
            max={6}
            onChange={(v) => setEdgeStyle({ ...edgeStyle, width: v })}
          />
        </Section>

        <Section
          open={openSection}
          setOpen={setOpenSection}
          id="export"
          title="Export & Save"
          icon={uiIcons.download}
        >
          <Label>Download as image</Label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button onClick={onDownloadPNG} style={exportBtnStyle()}>
              <Icon path={uiIcons.picture} size={14} /> PNG
            </button>
            <button onClick={onDownloadSVG} style={exportBtnStyle()}>
              <Icon path={uiIcons.download} size={14} /> SVG
            </button>
          </div>
          <Label>Save & restore</Label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onDownloadJSON} style={exportBtnStyle()}>
              <Icon path={uiIcons.file} size={14} /> Save
            </button>
            <button onClick={onLoadJSON} style={exportBtnStyle()}>
              <Icon path={uiIcons.upload} size={14} /> Load
            </button>
          </div>
        </Section>

        {(() => {
          const sNode = nodes.find((n) => n.id === selected);
          if (!sNode) return null;
          const hasMedia = !!(sNode.image || sNode.icon);
          const SelIconCmp = sNode.icon
            ? fluentIconsMap[sNode.icon]?.Icon
            : null;
          return (
            <Section
              open={openSection}
              setOpen={setOpenSection}
              id="nodeprops"
              title="Selected Node"
              icon={uiIcons.edit}
            >
              <Label>Visual badge</Label>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 8,
                  padding: 10,
                  background: tokens.neutralBackground3,
                  borderRadius: tokens.radiusMedium,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: tokens.radiusLarge,
                    background: sNode.image
                      ? tokens.neutralBackground1
                      : sNode.icon
                      ? `${tokens.brandBackground}1a`
                      : tokens.neutralBackground1,
                    border: sNode.image
                      ? `1px solid ${tokens.neutralStroke2}`
                      : `1px dashed ${tokens.neutralStroke1}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.brandBackground,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {sNode.image ? (
                    <img
                      src={sNode.image}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : SelIconCmp ? (
                    <SelIconCmp
                      primaryFill={tokens.brandBackground}
                      style={{ width: 22, height: 22 }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 18,
                        color: tokens.neutralForegroundDisabled,
                      }}
                    >
                      ?
                    </span>
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 11,
                    color: tokens.neutralForeground3,
                  }}
                >
                  {sNode.image
                    ? 'Image attached'
                    : sNode.icon
                    ? `Icon: ${sNode.icon}`
                    : 'No badge set'}
                </div>
                {(sNode.icon || sNode.image) && (
                  <button
                    onClick={() =>
                      onUpdateNode({
                        ...sNode,
                        icon: null,
                        image: null,
                        mediaLayout: undefined,
                        imageFit: undefined,
                      })
                    }
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      background: tokens.neutralBackground1,
                      color: tokens.neutralForeground2,
                      border: `1px solid ${tokens.neutralStroke1}`,
                      borderRadius: tokens.radiusSmall,
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              {hasMedia && (
                <>
                  <Label>Media Layout</Label>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    <button
                      onClick={() =>
                        onUpdateNode({ ...sNode, mediaLayout: 'left' })
                      }
                      style={pillBtn(sNode.mediaLayout !== 'top')}
                    >
                      Left Badge
                    </button>
                    <button
                      onClick={() =>
                        onUpdateNode({ ...sNode, mediaLayout: 'top' })
                      }
                      style={pillBtn(sNode.mediaLayout === 'top')}
                    >
                      Top Stacked
                    </button>
                  </div>
                  {sNode.image && sNode.mediaLayout === 'top' && (
                    <>
                      <Label>Image Fit</Label>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        <button
                          onClick={() =>
                            onUpdateNode({ ...sNode, imageFit: 'cover' })
                          }
                          style={pillBtn(sNode.imageFit !== 'contain')}
                        >
                          1:1 Cropped
                        </button>
                        <button
                          onClick={() =>
                            onUpdateNode({ ...sNode, imageFit: 'contain' })
                          }
                          style={pillBtn(sNode.imageFit === 'contain')}
                        >
                          Original Ratio
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              <Label>Pick a Fluent icon</Label>
              <IconPicker
                value={sNode.icon}
                onChange={(name) =>
                  onUpdateNode({
                    ...sNode,
                    icon: name,
                    image: null,
                    mediaLayout: sNode.mediaLayout || 'left',
                  })
                }
              />
              <Label>Or upload an image</Label>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      toast('Image is too large. Max 2MB.', 'error');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      onUpdateNode({
                        ...sNode,
                        image: ev.target?.result as string,
                        icon: null,
                        mediaLayout: sNode.mediaLayout || 'left',
                        imageFit: sNode.imageFit || 'cover',
                      });
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
                style={exportBtnStyle()}
              >
                <Icon path={uiIcons.upload} size={14} /> Upload image
              </button>
            </Section>
          );
        })()}

        {selectedEdgeObj && (
          <Section
            open={openSection}
            setOpen={setOpenSection}
            id="edgeprops"
            title="Selected Edge"
            icon={uiIcons.branch}
          >
            <Label>Label</Label>
            <input
              value={selectedEdgeObj.label || ''}
              onChange={(e) =>
                onUpdateEdge(selectedEdgeObj.id, { label: e.target.value })
              }
              placeholder="YES / NO / optional"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                border: `1px solid ${tokens.neutralStroke1}`,
                borderRadius: tokens.radiusMedium,
                fontFamily: tokens.fontFamily,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = tokens.brandBackground)
              }
              onBlur={(e) =>
                (e.target.style.borderColor = tokens.neutralStroke1)
              }
            />
            <div
              style={{
                marginTop: 14,
                padding: 10,
                background: selectedEdgeObj.style
                  ? `${tokens.brandBackground}10`
                  : tokens.neutralBackground3,
                border: `1px solid ${
                  selectedEdgeObj.style
                    ? `${tokens.brandBackground}40`
                    : tokens.neutralStroke2
                }`,
                borderRadius: tokens.radiusMedium,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: tokens.neutralForeground2,
                  fontWeight: 500,
                }}
              >
                {selectedEdgeObj.style ? (
                  <>
                    Using <b>custom style</b>
                  </>
                ) : (
                  <>
                    Using <b>global</b> style
                  </>
                )}
              </div>
              {selectedEdgeObj.style && (
                <button
                  onClick={() =>
                    onUpdateEdge(selectedEdgeObj.id, { style: null })
                  }
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: tokens.neutralBackground1,
                    color: tokens.neutralForeground2,
                    border: `1px solid ${tokens.neutralStroke1}`,
                    borderRadius: tokens.radiusSmall,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
            <Label>Line type</Label>
            <div style={{ display: 'flex', gap: 4 }}>
              {['solid', 'gradient'].map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    onUpdateEdge(selectedEdgeObj.id, {
                      style: {
                        ...(selectedEdgeObj.style || edgeStyle),
                        type: t as any,
                      },
                    })
                  }
                  style={pillBtn(
                    (selectedEdgeObj.style || edgeStyle).type === t
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Label>Dash style</Label>
            <div style={{ display: 'flex', gap: 4 }}>
              {['none', 'dashed', 'dotted'].map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    onUpdateEdge(selectedEdgeObj.id, {
                      style: {
                        ...(selectedEdgeObj.style || edgeStyle),
                        dash: t as any,
                      },
                    })
                  }
                  style={pillBtn(
                    (selectedEdgeObj.style || edgeStyle).dash === t
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Label>Primary color</Label>
            <ColorRow
              value={(selectedEdgeObj.style || edgeStyle).color}
              onChange={(v) =>
                onUpdateEdge(selectedEdgeObj.id, {
                  style: { ...(selectedEdgeObj.style || edgeStyle), color: v },
                })
              }
            />
            {(selectedEdgeObj.style || edgeStyle).type === 'gradient' && (
              <>
                <Label>Gradient end color</Label>
                <ColorRow
                  value={
                    (selectedEdgeObj.style || edgeStyle).color2 ||
                    (selectedEdgeObj.style || edgeStyle).color
                  }
                  onChange={(v) =>
                    onUpdateEdge(selectedEdgeObj.id, {
                      style: {
                        ...(selectedEdgeObj.style || edgeStyle),
                        color2: v,
                      },
                    })
                  }
                />
              </>
            )}
            <Label>
              Stroke width: {(selectedEdgeObj.style || edgeStyle).width}px
            </Label>
            <Slider
              value={(selectedEdgeObj.style || edgeStyle).width}
              min={1}
              max={6}
              onChange={(v) =>
                onUpdateEdge(selectedEdgeObj.id, {
                  style: { ...(selectedEdgeObj.style || edgeStyle), width: v },
                })
              }
            />
          </Section>
        )}
      </aside>
    </>
  );
};

// ============= Main App Component Wrapper =============
export default function App() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: makeDefault(),
    future: [],
  }));
  const {
    groups,
    nodes,
    edges,
    layoutSpacing = 60,
    minHeight = 260,
  } = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const lanes: Lane[] = useMemo(
    () =>
      groups
        .filter((g) => g.type === 'lane')
        .map((g) => ({
          id: g.id,
          name: g.name,
          subtitle: g.subtitle,
          width: g.width,
        })),
    [groups]
  );

  const setState = useCallback(
    (updater: (s: GraphState) => GraphState | GraphState) => {
      setHistory((h) => {
        const next =
          typeof updater === 'function' ? updater(h.present) : updater;
        if (next === h.present) return h;
        return {
          past: [...h.past, h.present].slice(-HISTORY_LIMIT),
          present: next,
          future: [],
        };
      });
    },
    []
  );

  const setStateNoHistory = useCallback(
    (updater: (s: GraphState) => GraphState | GraphState) => {
      setHistory((h) => ({
        ...h,
        present: typeof updater === 'function' ? updater(h.present) : updater,
      }));
    },
    []
  );

  const undo = () =>
    setHistory((h) =>
      h.past.length === 0
        ? h
        : {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future].slice(0, HISTORY_LIMIT),
          }
    );
  const redo = () =>
    setHistory((h) =>
      h.future.length === 0
        ? h
        : {
            past: [...h.past, h.present].slice(-HISTORY_LIMIT),
            present: h.future[0],
            future: h.future.slice(1),
          }
    );
  const reset = () => {
    setState(makeDefault());
    setSelected(null);
    setSelectedEdge(null);
    toast('Diagram cleared');
  };

  const [selected, setSelected] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [connectPreview, setConnectPreview] = useState<{
    from: string;
    x: number;
    y: number;
  } | null>(null);
  const [newNodePrompt, setNewNodePrompt] = useState<{
    from: string;
    worldX: number;
    worldY: number;
    group: string | null;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>({
    type: 'gradient',
    dash: 'none',
    color: '#ff8300',
    color2: '#ff4700',
    width: 2,
  });
  const [laneGap, setLaneGap] = useState(15);
  const [snapGuides, setSnapGuides] = useState<{
    vLines: number[];
    hLines: number[];
  }>({ vLines: [], hLines: [] });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, kind = 'info') => {
    const id = uid();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));
  const isMobile = viewport.width < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [labelPositions, setLabelPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const reportLabelPos = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      setLabelPositions((prev) =>
        prev[id] &&
        Math.abs(prev[id].x - pos.x) < 0.5 &&
        Math.abs(prev[id].y - pos.y) < 0.5
          ? prev
          : { ...prev, [id]: pos }
      );
    },
    []
  );

  const getRectForId = useCallback(
    (id: string) => {
      const n = nodes.find((x) => x.id === id);
      if (n) return { x: n.x, y: n.y, w: NODE_W, h: getNodeHeight(n) };
      const g = groups.find((x) => x.id === id);
      if (g) return { x: g.x, y: g.y, w: g.width, h: g.height };
      return null;
    },
    [nodes, groups]
  );

  const getGroupForRect = useCallback(
    (rect: { x: number; y: number; w: number; h: number }) => {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const lane = groups
        .filter(
          (g) =>
            g.type === 'lane' &&
            cx >= g.x &&
            cx <= g.x + g.width &&
            cy >= g.y &&
            cy <= g.y + g.height
        )
        .sort((a, b) => a.width * a.height - b.width * b.height)[0];
      if (lane) return lane.id;
      const pool = groups
        .filter(
          (g) =>
            g.type === 'pool' &&
            rect.x >= g.x &&
            rect.x <= g.x + g.width &&
            rect.y >= g.y &&
            rect.y <= g.y + g.height
        )
        .sort((a, b) => a.width * a.height - b.width * b.height)[0];
      return pool?.id || null;
    },
    [groups]
  );

  const addNode = (groupId: string | null, shape: ShapeType) => {
    const labels = {
      process: 'New process',
      decision: 'Decision?',
      start: 'Start',
      end: 'End',
      database: 'Database',
      draft: 'External System',
    };
    let nx = 400;
    let ny = 100;
    if (groupId) {
      const g = groups.find((x) => x.id === groupId);
      if (g) {
        nx = g.x + (g.width - NODE_W) / 2;
        const gNodes = nodes.filter((n) => n.lane === groupId);
        ny =
          gNodes.length > 0
            ? Math.max(...gNodes.map((n) => n.y + getNodeHeight(n))) +
              layoutSpacing
            : g.y + 100;
      }
    } else {
      const rootNodes = nodes.filter((n) => n.lane === null);
      if (rootNodes.length > 0)
        ny =
          Math.max(...rootNodes.map((n) => n.y + getNodeHeight(n))) +
          layoutSpacing;
    }
    const newNode: NodeData = {
      id: uid(),
      lane: groupId,
      label: labels[shape] || 'Node',
      shape,
      x: nx,
      y: ny,
      mediaLayout: 'left',
    };
    setState((s) => ({ ...s, nodes: [...s.nodes, newNode] }));
    setSelected(newNode.id);
    if (isMobile) setSidebarOpen(false);
  };

  const addGroup = (type: 'lane' | 'pool') => {
    let nx = 100;
    let ny = 100;
    if (groups.length > 0)
      nx = Math.max(...groups.map((g) => g.x + g.width)) + 40;
    setState((s) => ({
      ...s,
      groups: [
        ...s.groups,
        {
          id: uid(),
          type,
          parentId: null,
          name: `New ${type === 'lane' ? 'Swimlane' : 'Pool'}`,
          x: nx,
          y: ny,
          width: type === 'pool' ? 800 : DEFAULT_LANE_W,
          height: type === 'pool' ? 600 : DEFAULT_LANE_H,
        },
      ],
    }));
  };

  const updateNode = (n: NodeData) =>
    setState((s) => ({
      ...s,
      nodes: s.nodes.map((x) => (x.id === n.id ? n : x)),
    }));
  const updateGroup = (g: GroupData) =>
    setState((s) => ({
      ...s,
      groups: s.groups.map((x) => (x.id === g.id ? g : x)),
    }));

  const renameLane = (id: string, name: string, subtitle?: string) =>
    setState((s) => ({
      ...s,
      groups: s.groups.map((l) => (l.id === id ? { ...l, name, subtitle } : l)),
    }));

  const deleteSelection = (id: string) =>
    setState((s) => {
      const isNode = s.nodes.some((n) => n.id === id);
      if (isNode)
        return {
          ...s,
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.from !== id && e.to !== id),
        };
      const isGroup = s.groups.some((g) => g.id === id);
      if (isGroup)
        return {
          ...s,
          groups: s.groups.filter((g) => g.id !== id),
          nodes: s.nodes.map((n) => (n.lane === id ? { ...n, lane: null } : n)),
          edges: s.edges.filter((e) => e.from !== id && e.to !== id),
        };
      return { ...s, edges: s.edges.filter((e) => e.id !== id) };
    });

  const updateEdge = (id: string, patch: Partial<EdgeData>) =>
    setState((s) => ({
      ...s,
      edges: s.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const reorderLane = (laneId: string, toIndex: number) =>
    setState((s) => {
      const idx = s.groups.findIndex((l) => l.id === laneId);
      if (idx === -1) return s;
      const newGroups = [...s.groups];
      const [moved] = newGroups.splice(idx, 1);
      const lanesOnly = newGroups.filter((g) => g.type === 'lane');
      const target = lanesOnly[toIndex];
      if (target) {
        const targetIdx = newGroups.findIndex((g) => g.id === target.id);
        newGroups.splice(targetIdx, 0, moved);
      } else {
        newGroups.push(moved);
      }
      return { ...s, groups: newGroups };
    });

  const handleAutoArrange = () => {
    setState((s) => {
      const res = autoLayout(s.groups, s.nodes, s.edges, s.layoutSpacing || 60);
      return { ...s, groups: res.newGroups, nodes: res.newNodes };
    });
  };

  const buildSVGContent = useCallback(
    (esc: (s: string) => string) => {
      let defsSVG = '';
      let edgeSVG = '';
      let bgSVG = '';
      let fgSVG = '';
      let labelSVG = '';
      const labelData: Array<any> = [];

      groups
        .filter((g) => g.type === 'pool')
        .forEach((g) => {
          bgSVG += `<rect x="${g.x}" y="${g.y}" width="${g.width}" height="${g.height}" fill="rgba(255,255,255,0.4)" stroke="${tokens.neutralStroke2}" stroke-width="3" stroke-dasharray="8 6" rx="8" />`;
          bgSVG += `<text x="${g.x + 16}" y="${
            g.y + 30
          }" font-family='Segoe UI, system-ui, sans-serif' font-size="20" font-weight="600" fill="${
            tokens.neutralForeground2
          }">${esc(g.name)}</text>`;
          if (g.subtitle)
            bgSVG += `<text x="${g.x + 16}" y="${
              g.y + 50
            }" font-family='Segoe UI, system-ui, sans-serif' font-size="13" fill="${
              tokens.neutralForeground3
            }">${esc(g.subtitle)}</text>`;
        });

      groups
        .filter((g) => g.type === 'lane')
        .forEach((g) => {
          bgSVG += `<rect x="${g.x}" y="${g.y}" width="${g.width}" height="${g.height}" fill="${tokens.canvasLaneBackground}" stroke="${tokens.neutralStroke2}" stroke-width="1" rx="8" />`;
          bgSVG += `<path d="M ${g.x} ${g.y + 70} L ${g.x + g.width} ${
            g.y + 70
          }" stroke="${tokens.neutralStroke2}" stroke-width="1" />`;
          bgSVG += `<text x="${g.x + 16}" y="${
            g.y + 36
          }" font-family='Segoe UI, system-ui, sans-serif' font-size="20" font-weight="600" fill="${
            tokens.neutralForeground1
          }">${esc(g.name)}</text>`;
          if (g.subtitle)
            bgSVG += `<text x="${g.x + 16}" y="${
              g.y + 56
            }" font-family='Segoe UI, system-ui, sans-serif' font-size="13" fill="${
              tokens.neutralForeground3
            }">${esc(g.subtitle)}</text>`;
        });

      edges.forEach((e) => {
        const fromRect = getRectForId(e.from);
        const toRect = getRectForId(e.to);
        if (!fromRect || !toRect) return;
        const k = `${e.from}-${e.to}`;
        const group = edges.filter((x) => `${x.from}-${x.to}` === k);
        const idx = group.findIndex((x) => x.id === e.id);
        const eff = e.style || edgeStyle;
        const { d, mid } = routeEdge(fromRect, toRect, idx, group.length);
        if (!d) return;

        const gradId = `grad-${e.id}`;
        const markerId = `arrow-${e.id}`;
        const isGradient = eff.type === 'gradient';
        const arrowColor = isGradient ? eff.color2 || eff.color : eff.color;
        if (isGradient)
          defsSVG += `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="${
            fromRect.x
          }" y1="${fromRect.y}" x2="${toRect.x}" y2="${
            toRect.y
          }"><stop offset="0%" stop-color="${
            eff.color
          }"/><stop offset="100%" stop-color="${
            eff.color2 || eff.color
          }"/></linearGradient>`;
        defsSVG += `<marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${arrowColor}"/></marker>`;
        edgeSVG += `<path d="${d}" stroke="${
          isGradient ? `url(#${gradId})` : eff.color
        }" stroke-width="${
          eff.width
        }" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${
          eff.dash === 'dashed' ? '6 4' : eff.dash === 'dotted' ? '2 4' : 'none'
        }" marker-end="url(#${markerId})"/>`;

        if (e.label && mid)
          labelData.push({ pos: mid, label: e.label, color: arrowColor });
      });

      nodes.forEach((n) => {
        const rx =
          n.shape === 'start'
            ? Math.min(NODE_H / 2, NODE_W / 2)
            : n.shape === 'end'
            ? 6
            : n.shape === 'decision'
            ? 12
            : 8;
        const dash = n.shape === 'draft' ? '6 4' : 'none';
        const strokeW =
          n.shape === 'draft' || n.shape === 'start' || n.shape === 'end'
            ? 2
            : 1;
        const borderTopW = n.shape === 'database' ? 6 : strokeW;
        const fw = n.shape === 'start' || n.shape === 'end' ? 600 : 400;
        const hasMedia = !!(n.icon || n.image);
        const isTopLayout = hasMedia && n.mediaLayout === 'top';

        fgSVG += `<g transform="translate(${n.x}, ${n.y})">`;
        fgSVG += `<rect x="0" y="1" width="${NODE_W}" height="${getNodeHeight(
          n
        )}" rx="${rx}" fill="rgba(216, 231, 231, 0.6)"/>`;
        fgSVG += `<rect x="0" y="0" width="${NODE_W}" height="${getNodeHeight(
          n
        )}" rx="${rx}" fill="${tokens.neutralBackground1}" stroke="${
          tokens.neutralStroke1
        }" stroke-width="${strokeW}" stroke-dasharray="${dash}"/>`;

        if (borderTopW > strokeW)
          fgSVG += `<path d="M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${
            NODE_W - rx
          } 0 A ${rx} ${rx} 0 0 1 ${NODE_W} ${rx}" fill="none" stroke="${
            tokens.neutralStroke1
          }" stroke-width="${borderTopW}" stroke-dasharray="${dash}" />`;

        if (isTopLayout) {
          const mediaH = n.image && n.imageFit === 'cover' ? 172 : 100;
          fgSVG += `<path d="M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${
            NODE_W - rx
          } 0 A ${rx} ${rx} 0 0 1 ${NODE_W} ${rx} L ${NODE_W} ${mediaH} L 0 ${mediaH} Z" fill="${
            n.image ? tokens.neutralBackground1 : `${tokens.brandBackground}1a`
          }" stroke="${tokens.neutralStroke2}" stroke-width="1" />`;
          if (n.image)
            fgSVG += `<image href="${esc(
              n.image
            )}" x="0" y="0" width="${NODE_W}" height="${mediaH}" preserveAspectRatio="${
              n.imageFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'
            }" clip-path="url(#clip-${n.id})"/><clipPath id="clip-${
              n.id
            }"><path d="M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${
              NODE_W - rx
            } 0 A ${rx} ${rx} 0 0 1 ${NODE_W} ${rx} L ${NODE_W} ${mediaH} L 0 ${mediaH} Z" /></clipPath>`;
          else if (n.icon && fluentIconsMap[n.icon]) {
            const IconCmp = fluentIconsMap[n.icon].Icon;
            fgSVG += `<g transform="translate(${(NODE_W - 48) / 2}, ${
              (mediaH - 48) / 2
            })">${renderSimpleSvgToStringLocal(
              <IconCmp
                primaryFill={tokens.brandBackground}
                style={{ width: 48, height: 48 }}
              />
            )}</g>`;
          }
          fgSVG += `<text x="${NODE_W / 2}" y="${
            mediaH + (getNodeHeight(n) - mediaH) / 2 + 4
          }" text-anchor="middle" font-family='Segoe UI, system-ui, sans-serif' font-size="13" font-weight="${fw}" fill="${
            tokens.neutralForeground1
          }">${esc(n.label)}</text>`;
        } else {
          const badgeSize = 40;
          const badgeY = (getNodeHeight(n) - badgeSize) / 2;
          if (n.image)
            fgSVG += `<image href="${esc(
              n.image
            )}" x="8" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" preserveAspectRatio="${
              n.imageFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'
            }" clip-path="url(#clip-${n.id})"/><clipPath id="clip-${
              n.id
            }"><rect x="8" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" rx="8"/></clipPath>`;
          else if (n.icon && fluentIconsMap[n.icon]) {
            const IconCmp = fluentIconsMap[n.icon].Icon;
            fgSVG += `<rect x="8" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" rx="8" fill="${
              tokens.brandBackground
            }1a"/><g transform="translate(${8 + (badgeSize - 22) / 2}, ${
              badgeY + (badgeSize - 22) / 2
            })">${renderSimpleSvgToStringLocal(
              <IconCmp
                primaryFill={tokens.brandBackground}
                style={{ width: 22, height: 22 }}
              />
            )}</g>`;
          }
          fgSVG += `<text x="${hasMedia ? 58 : NODE_W / 2}" y="${
            getNodeHeight(n) / 2 + 4
          }" text-anchor="${
            hasMedia ? 'start' : 'middle'
          }" font-family='Segoe UI, system-ui, sans-serif' font-size="13" font-weight="${fw}" fill="${
            tokens.neutralForeground1
          }">${esc(n.label)}</text>`;
        }
        fgSVG += `</g>`;
      });

      labelData.forEach(({ pos, label, color }) => {
        const w = label.length * 7.5 + 18;
        const h = 22;
        labelSVG += `<rect x="${pos.x - w / 2 - 3}" y="${
          pos.y - h / 2 - 3
        }" width="${w + 6}" height="${h + 6}" rx="7" fill="${
          tokens.neutralBackground2
        }"/><rect x="${pos.x - w / 2}" y="${
          pos.y - h / 2
        }" width="${w}" height="${h}" rx="5" fill="${
          tokens.neutralBackground1
        }" stroke="${color}" stroke-width="1"/><text x="${pos.x}" y="${
          pos.y + 4
        }" text-anchor="middle" font-family='Segoe UI, system-ui, sans-serif' font-size="11" font-weight="700" fill="${color}">${esc(
          label
        )}</text>`;
      });

      return { defsSVG, bgSVG, edgeSVG, fgSVG, labelSVG };
    },
    [groups, nodes, edges, getRectForId, edgeStyle]
  );

  const fitViewBounds = useCallback(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const check = (x: number, y: number, w: number, h: number) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    };
    groups.forEach((g) => check(g.x, g.y, g.width, g.height));
    nodes.forEach((n) => check(n.x, n.y, NODE_W, getNodeHeight(n)));
    if (minX === Infinity) return { minX: 0, minY: 0, w: 800, h: 600 };
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, [groups, nodes]);

  const downloadFile = (dataStr: string, ext: string, type: string) => {
    const blob = new Blob([dataStr], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowchart-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`${ext.toUpperCase()} downloaded`, 'success');
  };

  const getSVGString = () => {
    const b = fitViewBounds();
    const pad = 40;
    const esc = (s: string) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const s = buildSVGContent(esc);
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="${
      b.minX - pad
    } ${b.minY - pad} ${b.w + pad * 2} ${b.h + pad * 2}" width="${
      b.w + pad * 2
    }" height="${b.h + pad * 2}"><defs>${s.defsSVG}</defs><rect x="${
      b.minX - pad
    }" y="${b.minY - pad}" width="${b.w + pad * 2}" height="${
      b.h + pad * 2
    }" fill="${tokens.neutralBackground2}"/>${s.bgSVG}${s.edgeSVG}${s.fgSVG}${
      s.labelSVG
    }</svg>`;
  };

  const downloadSVG = () =>
    downloadFile(getSVGString(), 'svg', 'image/svg+xml;charset=utf-8');
  const downloadJSON = () =>
    downloadFile(
      JSON.stringify(
        {
          version: 3,
          created: new Date().toISOString(),
          groups,
          nodes,
          edges,
          edgeStyle,
          layoutSpacing,
        },
        null,
        2
      ),
      'json',
      'application/json'
    );

  const downloadPNG = async () => {
    const b = fitViewBounds();
    const pad = 40;
    const totalW = b.w + pad * 2;
    const totalH = b.h + pad * 2;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = totalW * scale;
    canvas.height = totalH * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(scale, scale);
    const img = new Image();
    const svgBlob = new Blob([getSVGString()], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        if (ctx) ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);
        resolve();
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(svgUrl);
        reject(e);
      };
      img.src = svgUrl;
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowchart-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('PNG downloaded', 'success');
    }, 'image/png');
  };

  const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.nodes || !data.edges) throw new Error('Invalid file format');

        let loadedGroups = data.groups || [];
        if (!data.groups && data.lanes) {
          let xC = 100;
          loadedGroups = data.lanes.map((l: any) => {
            const g = {
              id: l.id,
              type: 'lane',
              parentId: null,
              name: l.name,
              subtitle: l.subtitle,
              x: xC,
              y: 100,
              width: l.width || DEFAULT_LANE_W,
              height: DEFAULT_LANE_H,
            };
            xC += g.width + (data.laneGap || 15);
            return g;
          });
        }

        setState({
          groups: loadedGroups,
          nodes: data.nodes,
          edges: data.edges,
          layoutSpacing: data.layoutSpacing || 60,
        });
        if (data.edgeStyle) setEdgeStyle(data.edgeStyle);
        setSelected(null);
        setSelectedEdge(null);
        toast('Diagram loaded', 'success');

        if (!data.groups && data.lanes) handleAutoArrange();
      } catch (err: any) {
        toast('Could not load file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadTemplate = (key: string) => {
    const t = templates[key];
    if (!t) return;
    const fresh = t.build();
    const res = autoLayout(
      fresh.groups,
      fresh.nodes,
      fresh.edges,
      fresh.layoutSpacing || 60
    );
    fresh.groups = res.newGroups;
    fresh.nodes = res.newNodes;
    setState(fresh);
    setSelected(null);
    setSelectedEdge(null);
    if (isMobile) setSidebarOpen(false);
    toast(`Loaded ${t.name}`, 'success');
  };

  // Drags
  const pointFromEvent = (e: any) =>
    e.touches
      ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
      : { clientX: e.clientX, clientY: e.clientY };
  const screenToWorld = (e: any) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const p = pointFromEvent(e);
    return {
      x: (p.clientX - rect.left - pan.x) / zoom,
      y: (p.clientY - rect.top - pan.y) / zoom,
    };
  };

  const onDragStartLocal = (e: any, id: string, type: 'node' | 'group') => {
    const obj =
      type === 'node'
        ? nodes.find((n) => n.id === id)
        : groups.find((g) => g.id === id);
    if (!obj) return;
    const world = screenToWorld(e);
    setDrag({
      type,
      id,
      offsetX: world.x - obj.x,
      offsetY: world.y - obj.y,
      snapshot: history.present,
    });
  };

  const onCanvasMouseDown = (e: any) => {
    if (
      e.target === canvasRef.current ||
      e.target.dataset?.canvasBg === 'true'
    ) {
      const p = pointFromEvent(e);
      setDrag({
        type: 'pan',
        startX: p.clientX,
        startY: p.clientY,
        panX: pan.x,
        panY: pan.y,
      });
      setSelected(null);
      setSelectedEdge(null);
      setNewNodePrompt(null);
    }
  };

  const onMouseMove = useCallback(
    (e: any) => {
      if (!drag) return;
      if (e.touches && e.cancelable) e.preventDefault();
      const p = pointFromEvent(e);

      if (
        drag.type === 'pan' &&
        drag.startX !== undefined &&
        drag.startY !== undefined
      ) {
        setPan({
          x: drag.panX! + (p.clientX - drag.startX),
          y: drag.panY! + (p.clientY - drag.startY),
        });
      } else if (drag.type === 'node' && drag.id) {
        const world = screenToWorld(e);
        let nx = snap(world.x - drag.offsetX!);
        let ny = snap(world.y - drag.offsetY!);

        const newParent = getGroupForRect({
          x: nx,
          y: ny,
          w: NODE_W,
          h: NODE_H,
        });
        setStateNoHistory((s) => ({
          ...s,
          nodes: s.nodes.map((n) =>
            n.id === drag.id ? { ...n, x: nx, y: ny, lane: newParent } : n
          ),
        }));

        if (newParent) {
          const lane = groups.find((g) => g.id === newParent);
          if (
            lane &&
            (nx + NODE_W + 40 > lane.x + lane.width ||
              ny + NODE_H + 40 > lane.y + lane.height)
          ) {
            setStateNoHistory((s) => ({
              ...s,
              groups: s.groups.map((g) =>
                g.id === newParent
                  ? {
                      ...g,
                      width: Math.max(g.width, nx - g.x + NODE_W + 40),
                      height: Math.max(g.height, ny - g.y + NODE_H + 40),
                    }
                  : g
              ),
            }));
          }
        }
      } else if (drag.type === 'group' && drag.id && drag.snapshot) {
        const world = screenToWorld(e);
        const origG = drag.snapshot.groups.find((g) => g.id === drag.id);
        if (!origG) return;
        const nx = snap(world.x - drag.offsetX!);
        const ny = snap(world.y - drag.offsetY!);
        const dx = nx - origG.x;
        const dy = ny - origG.y;

        const childLanes =
          origG.type === 'pool'
            ? drag.snapshot.groups.filter((g) => g.parentId === origG.id)
            : [];
        const laneIdsToMove = [origG.id, ...childLanes.map((l) => l.id)];
        const childNodes = drag.snapshot.nodes.filter(
          (n) => n.lane && laneIdsToMove.includes(n.lane)
        );

        const newParent =
          origG.type === 'lane'
            ? getGroupForRect({ x: nx, y: ny, w: origG.width, h: origG.height })
            : null;

        setStateNoHistory((s) => ({
          ...s,
          groups: s.groups.map((g) => {
            if (g.id === drag.id)
              return { ...g, x: nx, y: ny, parentId: newParent };
            if (childLanes.find((c) => c.id === g.id))
              return { ...g, x: g.x + dx, y: g.y + dy };
            return g;
          }),
          nodes: s.nodes.map((n) => {
            const origN = childNodes.find((c) => c.id === n.id);
            if (origN) return { ...n, x: origN.x + dx, y: origN.y + dy };
            return n;
          }),
        }));
      } else if (drag.type === 'connect' && drag.from) {
        const world = screenToWorld(e);
        setConnectPreview({ from: drag.from, x: world.x, y: world.y });
      } else if (
        drag.type === 'group-resize' &&
        drag.id &&
        drag.startWidth !== undefined &&
        drag.startHeight !== undefined
      ) {
        const world = screenToWorld(e);
        const g = drag.snapshot?.groups.find((x) => x.id === drag.id);
        if (!g) return;
        const nw = Math.max(160, snap(world.x - g.x));
        const nh = Math.max(100, snap(world.y - g.y));
        setStateNoHistory((s) => ({
          ...s,
          groups: s.groups.map((x) =>
            x.id === drag.id ? { ...x, width: nw, height: nh } : x
          ),
        }));
      }
    },
    [drag, pan, zoom, groups, getGroupForRect, setStateNoHistory]
  );

  const onMouseUp = useCallback(
    (e: any) => {
      if (!drag) return;
      if (drag.type === 'connect' && drag.from) {
        const world = screenToWorld(e);
        const targetNode = nodes.find(
          (n) =>
            world.x >= n.x &&
            world.x <= n.x + NODE_W &&
            world.y >= n.y &&
            world.y <= n.y + getNodeHeight(n)
        );
        const targetGroup = [...groups]
          .reverse()
          .find(
            (g) =>
              world.x >= g.x &&
              world.x <= g.x + g.width &&
              world.y >= g.y &&
              world.y <= g.y + g.height
          );

        const targetId = targetNode
          ? targetNode.id
          : targetGroup
          ? targetGroup.id
          : null;

        if (targetId && targetId !== drag.from) {
          setState((s) => ({
            ...s,
            edges: [...s.edges, { id: uid(), from: drag.from!, to: targetId }],
          }));
        } else if (!targetId) {
          setNewNodePrompt({
            from: drag.from,
            worldX: world.x,
            worldY: world.y,
            group: getGroupForRect({
              x: world.x,
              y: world.y,
              w: NODE_W,
              h: NODE_H,
            }),
          });
        }
        setConnectPreview(null);
      } else if (
        (drag.type === 'node' ||
          drag.type === 'group' ||
          drag.type === 'group-resize') &&
        drag.snapshot
      ) {
        setHistory((h) => ({
          past: [...h.past, drag.snapshot!].slice(-HISTORY_LIMIT),
          present: h.present,
          future: [],
        }));
      }
      setDrag(null);
    },
    [drag, nodes, groups, setState, getGroupForRect]
  );

  const confirmNewNode = useCallback(
    (shape: ShapeType) => {
      if (!newNodePrompt) return;
      const labels = {
        process: 'New process',
        decision: 'Decision?',
        start: 'Start',
        end: 'End',
        database: 'Database',
        draft: 'External System',
      };
      const newNode: NodeData = {
        id: uid(),
        lane: newNodePrompt.group,
        label: labels[shape],
        shape,
        x: snap(newNodePrompt.worldX - NODE_W / 2),
        y: snap(newNodePrompt.worldY - NODE_H / 2),
      };
      setState((s) => ({
        ...s,
        nodes: [...s.nodes, newNode],
        edges: [
          ...s.edges,
          { id: uid(), from: newNodePrompt.from, to: newNode.id },
        ],
      }));
      setSelected(newNode.id);
      setNewNodePrompt(null);
    },
    [newNodePrompt, setState]
  );

  const duplicateNode = useCallback(
    (idOrEvent?: string | any) => {
      const targetId = typeof idOrEvent === 'string' ? idOrEvent : selected;
      if (!targetId) return;
      const src = nodes.find((n) => n.id === targetId);
      if (!src) return;
      const copy = { ...src, id: uid(), x: src.x + 20, y: src.y + 20 };
      setState((s) => ({ ...s, nodes: [...s.nodes, copy] }));
      setSelected(copy.id);
    },
    [selected, nodes, setState]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      )
        return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key === 'd') {
        e.preventDefault();
        duplicateNode();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected) deleteSelection(selected);
        else if (selectedEdge) deleteSelection(selectedEdge);
      }
      if (e.key === 'Escape') {
        setSelected(null);
        setSelectedEdge(null);
        setDrag(null);
        setConnectPreview(null);
        setNewNodePrompt(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, selectedEdge, undo, redo, duplicateNode, nodes]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [drag, onMouseMove, onMouseUp]);

  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const onCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom };
      return;
    }
    if (e.touches.length === 1) onCanvasMouseDown(e);
  };
  const onCanvasTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchRef.current.dist;
      setZoom(Math.max(0.3, Math.min(2, pinchRef.current.zoom * ratio)));
      if (e.cancelable) e.preventDefault();
    }
  };
  const onCanvasTouchEnd = () => {
    pinchRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
    }
  };

  const fitView = useCallback(() => {
    if (!canvasRef.current) return;
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    const b = fitViewBounds();
    const z = Math.min(cw / (b.w + 80), ch / (b.h + 80), 1);
    setZoom(z);
    setPan({
      x: (cw - b.w * z) / 2 - b.minX * z,
      y: (ch - b.h * z) / 2 - b.minY * z,
    });
  }, [groups, nodes, viewport.width, viewport.height]);

  useEffect(() => {
    fitView(); /* eslint-disable-next-line */
  }, []);

  const previewLine = useMemo(() => {
    if (!connectPreview) return null;
    const fromRect = getRectForId(connectPreview.from);
    if (!fromRect) return null;
    return {
      x1: fromRect.x + fromRect.w / 2,
      y1: fromRect.y + fromRect.h,
      x2: connectPreview.x,
      y2: connectPreview.y,
    };
  }, [connectPreview, getRectForId]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        fontFamily: tokens.fontFamily,
        background: tokens.neutralBackground2,
        color: tokens.neutralForeground1,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background:
                t.kind === 'error' ? '#d13438' : tokens.neutralForeground1,
              color: tokens.neutralBackground1,
              padding: '10px 16px',
              borderRadius: tokens.radiusMedium,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: tokens.shadow16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'fadeIn 0.2s, fadeOut 0.2s 2.6s',
            }}
          >
            {t.kind === 'error' ? (
              <ErrorCircle24Regular style={{ width: 16, height: 16 }} />
            ) : t.kind === 'success' ? (
              <CheckmarkCircle24Regular style={{ width: 16, height: 16 }} />
            ) : (
              <Info24Regular style={{ width: 16, height: 16 }} />
            )}
            {t.message}
          </div>
        ))}
      </div>

      <Sidebar
        lanes={lanes}
        nodes={nodes}
        edges={edges}
        selected={selected}
        selectedEdge={selectedEdge}
        onAddNode={addNode}
        onAddLane={() => addGroup('lane')}
        onRenameLane={renameLane}
        onDeleteLane={deleteSelection}
        onReorderLane={reorderLane}
        edgeStyle={edgeStyle}
        setEdgeStyle={setEdgeStyle}
        onUpdateEdge={updateEdge}
        onUpdateNode={updateNode}
        onAutoArrange={handleAutoArrange}
        onReset={reset}
        laneGap={laneGap}
        setLaneGap={setLaneGap}
        layoutSpacing={layoutSpacing}
        setLayoutSpacing={(v) =>
          setStateNoHistory((s) => ({ ...s, layoutSpacing: v }))
        }
        onDownloadSVG={downloadSVG}
        onDownloadPNG={downloadPNG}
        onDownloadJSON={downloadJSON}
        onLoadJSON={() => fileInputRef.current?.click()}
        onLoadTemplate={loadTemplate}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onDuplicate={duplicateNode}
        toast={toast}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleLoadJSON}
        style={{ display: 'none' }}
      />

      <main
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: isMobile ? 8 : 16,
            left: isMobile ? 8 : 16,
            right: isMobile ? 8 : 16,
            zIndex: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: isMobile ? 6 : 12,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: isMobile ? 6 : 12,
              alignItems: 'center',
              pointerEvents: 'auto',
              minWidth: 0,
              flex: 1,
            }}
          >
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: tokens.radiusMedium,
                  background: tokens.neutralBackground1,
                  border: `1px solid ${tokens.neutralStroke2}`,
                  boxShadow: tokens.shadow4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tokens.neutralForeground1,
                }}
              >
                <Icon path={uiIcons.menu} size={20} />
              </button>
            )}
            {!isMobile && (
              <div
                style={{
                  background: tokens.neutralBackground1,
                  border: `1px solid ${tokens.neutralStroke2}`,
                  borderRadius: tokens.radiusMedium,
                  boxShadow: tokens.shadow4,
                  padding: '6px 12px',
                  fontSize: 13,
                  color: tokens.neutralForeground2,
                }}
              >
                {drag?.type === 'connect' ? (
                  <span style={{ color: tokens.accent, fontWeight: 600 }}>
                    ⚡ Drop on a node or container to connect
                  </span>
                ) : (
                  <span>
                    Drag elements freely · Double-click to edit · Drag canvas to
                    pan
                  </span>
                )}
              </div>
            )}
            {isMobile && drag?.type === 'connect' && (
              <div
                style={{
                  background: tokens.neutralBackground1,
                  border: `1px solid ${tokens.accent}`,
                  borderRadius: tokens.radiusMedium,
                  boxShadow: tokens.shadow4,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: tokens.accent,
                  fontWeight: 600,
                }}
              >
                ⚡ Drop to connect
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: tokens.neutralBackground1,
              border: `1px solid ${tokens.neutralStroke2}`,
              borderRadius: tokens.radiusMedium,
              boxShadow: tokens.shadow4,
              padding: 4,
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              style={toolBtnStyle()}
            >
              −
            </button>
            {!isMobile && (
              <div
                style={{
                  padding: '6px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.neutralForeground2,
                  minWidth: 48,
                  textAlign: 'center',
                }}
              >
                {Math.round(zoom * 100)}%
              </div>
            )}
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              style={toolBtnStyle()}
            >
              +
            </button>
            <div
              style={{
                width: 1,
                background: tokens.neutralStroke2,
                margin: '0 2px',
              }}
            />
            <button
              onClick={fitView}
              style={{
                ...toolBtnStyle(),
                padding: '6px 10px',
                fontSize: 12,
                width: 'auto',
              }}
            >
              Fit
            </button>
          </div>
        </div>

        <div
          ref={canvasRef}
          onMouseDown={onCanvasMouseDown}
          onTouchStart={onCanvasTouchStart}
          onTouchMove={onCanvasTouchMove}
          onTouchEnd={onCanvasTouchEnd}
          onWheel={onWheel}
          data-canvas-bg="true"
          style={{
            position: 'absolute',
            inset: 0,
            cursor: drag?.type === 'pan' ? 'grabbing' : 'grab',
            backgroundImage: `radial-gradient(circle, ${tokens.neutralStroke2} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            backgroundColor: tokens.neutralBackground2,
            overflow: 'hidden',
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          <div
            data-canvas-bg="true"
            style={{
              position: 'absolute',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: 10000,
              height: 10000,
            }}
          >
            {groups.length === 0 && nodes.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 120,
                  transform: 'translateX(-50%)',
                  width: 300,
                  textAlign: 'center',
                  fontFamily: tokens.fontFamily,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addNode(null, 'process');
                  }}
                  style={{
                    width: 64,
                    height: 64,
                    margin: '0 auto 16px',
                    borderRadius: '50%',
                    border: `2px dashed ${tokens.brandBackground}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.brandBackground,
                    background: `${tokens.brandBackground}10`,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <Icon path={uiIcons.add} size={28} />
                </button>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: tokens.neutralForeground1,
                    marginBottom: 4,
                  }}
                >
                  Add your first node
                </div>
                <div style={{ fontSize: 12, color: tokens.neutralForeground3 }}>
                  Click above, or add a Container from the sidebar.
                </div>
              </div>
            )}

            {groups
              .filter((g) => g.type === 'pool')
              .map((g) => (
                <GroupContainer
                  key={g.id}
                  group={g}
                  selected={selected === g.id}
                  onSelect={setSelected}
                  onChange={updateGroup}
                  onDelete={deleteSelection}
                  onDragStart={(e, id) => onDragStartLocal(e, id, 'group')}
                  onResizeStart={(e, id) => {
                    e.stopPropagation();
                    setDrag({
                      type: 'group-resize',
                      id,
                      startWidth: g.width,
                      startHeight: g.height,
                      snapshot: history.present,
                    });
                  }}
                  onStartConnect={(e, id) => onStartConnect(e, id)}
                />
              ))}

            {groups
              .filter((g) => g.type === 'lane')
              .map((g) => {
                const laneNodeCount = nodes.filter(
                  (n) => n.lane === g.id
                ).length;
                return (
                  <div key={g.id}>
                    <GroupContainer
                      group={g}
                      selected={selected === g.id}
                      onSelect={setSelected}
                      onChange={updateGroup}
                      onDelete={deleteSelection}
                      onDragStart={(e, id) => onDragStartLocal(e, id, 'group')}
                      onResizeStart={(e, id) => {
                        e.stopPropagation();
                        setDrag({
                          type: 'group-resize',
                          id,
                          startWidth: g.width,
                          startHeight: g.height,
                          snapshot: history.present,
                        });
                      }}
                      onStartConnect={(e, id) => onStartConnect(e, id)}
                    />
                    {laneNodeCount === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: g.x + g.width / 2 - 100,
                          top: g.y + 120,
                          width: 200,
                          textAlign: 'center',
                          fontFamily: tokens.fontFamily,
                          pointerEvents: 'none',
                          zIndex: 2,
                        }}
                      >
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            addNode(g.id, 'process');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            addNode(g.id, 'process');
                          }}
                          style={{
                            width: 48,
                            height: 48,
                            margin: '0 auto 12px',
                            borderRadius: '50%',
                            border: `2px dashed ${tokens.brandBackground}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: tokens.brandBackground,
                            background: `${tokens.brandBackground}10`,
                            cursor: 'pointer',
                            padding: 0,
                            pointerEvents: 'auto',
                          }}
                        >
                          <Icon path={uiIcons.add} size={24} />
                        </button>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: tokens.neutralForeground2,
                          }}
                        >
                          Empty Swimlane
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              <g style={{ pointerEvents: 'auto' }}>
                {edges.map((e) => {
                  const fromRect = getRectForId(e.from);
                  const toRect = getRectForId(e.to);
                  if (!fromRect || !toRect) return null;
                  const group = edges.filter(
                    (x) => `${x.from}-${x.to}` === `${e.from}-${e.to}`
                  );
                  return (
                    <EdgeLine
                      key={e.id}
                      edge={e}
                      fromRect={fromRect}
                      toRect={toRect}
                      idx={group.findIndex((x) => x.id === e.id)}
                      total={group.length}
                      style={e.style || edgeStyle}
                      selected={selectedEdge === e.id}
                      onSelect={(id) => {
                        setSelectedEdge(id);
                        setSelected(null);
                      }}
                      onMid={reportLabelPos}
                    />
                  );
                })}
                {previewLine && (
                  <path
                    d={`M ${previewLine.x1} ${previewLine.y1} C ${
                      previewLine.x1
                    } ${previewLine.y1 + 40}, ${previewLine.x2} ${
                      previewLine.y2 - 40
                    }, ${previewLine.x2} ${previewLine.y2}`}
                    stroke={tokens.accent}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    fill="none"
                    pointerEvents="none"
                  />
                )}
              </g>
            </svg>

            {nodes.map((n) => (
              <GraphNode
                key={n.id}
                node={n}
                selected={selected === n.id}
                connecting={drag?.type === 'connect' && drag.from === n.id}
                onSelect={setSelected}
                onChange={updateNode}
                onDelete={deleteSelection}
                onDragStart={(e, id) => onDragStartLocal(e, id, 'node')}
                onStartConnect={onStartConnect}
                onDuplicate={duplicateNode}
                accent={tokens.brandBackground}
              />
            ))}

            {(snapGuides.vLines.length > 0 || snapGuides.hLines.length > 0) && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'visible',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              >
                {snapGuides.vLines.map((x, i) => (
                  <line
                    key={`v${i}`}
                    x1={x}
                    y1={-5000}
                    x2={x}
                    y2={5000}
                    stroke={tokens.accent}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    opacity={0.8}
                  />
                ))}
                {snapGuides.hLines.map((y, i) => (
                  <line
                    key={`h${i}`}
                    x1={-5000}
                    y1={y}
                    x2={5000}
                    y2={y}
                    stroke={tokens.accent}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    opacity={0.8}
                  />
                ))}
              </svg>
            )}

            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 6,
              }}
            >
              {edges.map((e) => (
                <EdgeLabel
                  key={e.id}
                  edge={e}
                  pos={labelPositions[e.id]}
                  style={e.style || edgeStyle}
                />
              ))}
            </svg>

            {newNodePrompt && (
              <div
                style={{
                  position: 'absolute',
                  left: newNodePrompt.worldX,
                  top: newNodePrompt.worldY,
                  background: tokens.neutralBackground1,
                  border: `1px solid ${tokens.neutralStroke2}`,
                  borderRadius: tokens.radiusMedium,
                  boxShadow: tokens.shadow16,
                  padding: 8,
                  zIndex: 100,
                  width: 240,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: tokens.neutralForeground3,
                    marginBottom: 4,
                    padding: '0 4px',
                  }}
                >
                  Connect to new node
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 4,
                  }}
                >
                  {[
                    {
                      shape: 'process',
                      label: 'Process',
                      fw: 400,
                      border: `1px solid ${tokens.neutralStroke1}`,
                      radius: tokens.radiusLarge,
                    },
                    {
                      shape: 'decision',
                      label: 'Decision',
                      fw: 400,
                      border: `1px solid ${tokens.neutralStroke1}`,
                      radius: tokens.radiusXLarge,
                    },
                    {
                      shape: 'start',
                      label: 'Start',
                      fw: 600,
                      border: `2px solid ${tokens.neutralStroke1}`,
                      radius: tokens.radiusCircular,
                    },
                    {
                      shape: 'end',
                      label: 'End',
                      fw: 600,
                      border: `2px solid ${tokens.neutralStroke1}`,
                      radius: tokens.radiusMedium,
                    },
                    {
                      shape: 'database',
                      label: 'Database',
                      fw: 400,
                      border: `1px solid ${tokens.neutralStroke1}`,
                      radius: tokens.radiusLarge,
                      borderTop: `6px solid ${tokens.neutralStroke1}`,
                    },
                    {
                      shape: 'draft',
                      label: 'External',
                      fw: 400,
                      border: `2px dashed ${tokens.neutralStroke1}`,
                      radius: tokens.radiusLarge,
                    },
                  ].map((s) => (
                    <button
                      key={s.shape}
                      onClick={() => confirmNewNode(s.shape as ShapeType)}
                      style={{
                        padding: '6px 8px',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: tokens.radiusSmall,
                        cursor: 'pointer',
                        fontSize: 11,
                        color: tokens.neutralForeground1,
                        fontFamily: tokens.fontFamily,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          tokens.neutralBackground3)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      <div
                        style={{
                          width: 14,
                          height: 10,
                          border: s.border,
                          borderTop: s.borderTop || s.border,
                          borderRadius: s.radius,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: s.fw }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const toolBtnStyle = (): React.CSSProperties => ({
  width: 28,
  height: 28,
  border: 'none',
  background: 'transparent',
  borderRadius: tokens.radiusSmall,
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 600,
  color: tokens.neutralForeground1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
});
