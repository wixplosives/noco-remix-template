import { useLoaderData } from "@remix-run/react";
import { NocoPage, loadViewerPage } from "noco-lib/viewer/noco-client";
import { registry } from "~/noco/registry";

export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader() {
  return await loadViewerPage();
}

export default function Noco() {
  const nocoDoc = useLoaderData<typeof loader>();
  return <NocoPage doc={nocoDoc} registry={registry} fallback={"loading..."} />;
}
