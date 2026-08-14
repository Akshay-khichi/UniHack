import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/spectrace/States";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Workspace Settings — SpecTrace" },
      {
        name: "description",
        content: "Workspace, confidence thresholds and export defaults for SpecTrace.",
      },
      { property: "og:title", content: "Workspace Settings — SpecTrace" },
      {
        property: "og:description",
        content: "Configure review thresholds and export defaults.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Workspace Settings"
        subtitle="Thresholds and defaults that govern how product intelligence is trusted."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Workspace</span>
            <span className="font-medium">HydroMax · Product Data</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Review threshold</span>
            <span className="tabular font-medium">Confidence below 80%</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conflict policy</span>
            <span className="font-medium">Never auto-select a value</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Export defaults</span>
            <span className="font-medium">JSON with evidence, CSV flat</span>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Settings are read-only in this prototype and will become editable once the API is
        connected.
      </p>
    </div>
  );
}
