export interface WidgetConfig {
  id: string;
  type: string;
  label: string;
  icon: string;
  visible: boolean;
  settings: Record<string, unknown>;
  order: number;
}
