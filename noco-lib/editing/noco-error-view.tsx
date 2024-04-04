import { ComponentDriver } from "./component-registry";

export function ErrorView({ message }: { message: string }) {
  return (
    <div>
      <h1>{message}</h1>
    </div>
  );
}

export const systemErrors: ComponentDriver[] = [
  {
    id: "NocoErrorView",
    type: "#noco-system-component",
    loadComponent: async () => ErrorView,
    LoadSchema: async () => {},
    component: ErrorView,
  },
];
