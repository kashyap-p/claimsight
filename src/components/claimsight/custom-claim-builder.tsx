"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, Play, Wand2, ChevronDown, ChevronUp,
  FileText, Eye, Lightbulb, AlertCircle,
} from "lucide-react";

export interface CustomClaimData {
  claimant: string;
  lob: "auto" | "homeowners" | "property";
  amount: number;
  location: string;
  dateOfLoss: string;
  policyId: string;
  narrative: string;
  documents: { title: string; content: string }[];
  photos: { description: string }[];
}

interface Props {
  onRunCustom: (claim: CustomClaimData) => void;
}

const EXAMPLE_TEMPLATES = [
  {
    label: "Auto — minor fender bender",
    lob: "auto" as const,
    policyId: "AUTO-PL-88231",
    narrative:
      "I was parked at the grocery store and when I came back someone had backed into my front bumper. There's a dent and scratched paint. No note was left. Damage looks minor.",
    amount: 1800,
    documents: [
      { title: "FNOL Form", content: "Claimant: Test User | Policy: AUTO-PL-88231 | Vehicle: 2020 Honda Civic | Date of Loss: today | Location: H-E-B parking lot | Coverage: Collision $500 deductible. Parked vehicle, unattended, hit by unknown party." },
    ],
    photos: [
      { description: "Front bumper of silver Honda Civic in parking lot. Horizontal dent and white paint transfer across front bumper. Damage appears minor, no structural involvement." },
    ],
  },
  {
    label: "Homeowners — kitchen water leak",
    lob: "homeowners" as const,
    policyId: "HO-3-44920",
    narrative:
      "My dishwasher supply line failed while we were at work. Came home to water all over the kitchen and into the hallway. Subfloor is warped and cabinets are damaged.",
    amount: 9500,
    documents: [
      { title: "HO Claim Form", content: "Claimant: Test User | Policy: HO-3-44920 | Property: 123 Test St | Date of Loss: today | Coverage A: $275,000 | AOP Deductible: $1,000 | Cause: Sudden discharge from dishwasher supply line. Mitigation started within 4 hours." },
    ],
    photos: [
      { description: "Kitchen floor with standing water. Dishwasher area shows water staining. Base cabinets swollen at bottom. Hardwood flooring in adjacent hallway buckled." },
    ],
  },
  {
    label: "Auto — suspicious single-vehicle",
    lob: "auto" as const,
    policyId: "AUTO-PL-77014",
    narrative:
      "I hit a deer on a country road at night. The front of my car is pretty smashed up. I didn't call the police because it was late and I just wanted to get home.",
    amount: 12500,
    documents: [
      { title: "FNOL Form", content: "Claimant: Test User | Policy: AUTO-PL-77014 | Vehicle: 2019 BMW 330i | Date of Loss: 11 PM last night | Location: Rural county road | Coverage: Collision $1,000 deductible. Single vehicle, animal strike, no police report." },
    ],
    photos: [
      { description: "Front end of dark blue BMW. Significant front-end damage — bumper, hood, and headlights all damaged. Vehicle photographed in a residential garage, not at roadside. No blood or hair visible indicating animal contact. Damage pattern appears broader than typical deer strike." },
    ],
  },
];

export function CustomClaimBuilder({ onRunCustom }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<CustomClaimData>({
    claimant: "",
    lob: "auto",
    amount: 0,
    location: "",
    dateOfLoss: new Date().toISOString().slice(0, 10),
    policyId: "AUTO-PL-88231",
    narrative: "",
    documents: [{ title: "", content: "" }],
    photos: [{ description: "" }],
  });

  const update = (patch: Partial<CustomClaimData>) => setData((d) => ({ ...d, ...patch }));

  const addDoc = () => update({ documents: [...data.documents, { title: "", content: "" }] });
  const removeDoc = (i: number) => update({ documents: data.documents.filter((_, idx) => idx !== i) });
  const addPhoto = () => update({ photos: [...data.photos, { description: "" }] });
  const removePhoto = (i: number) => update({ photos: data.photos.filter((_, idx) => idx !== i) });

  const loadTemplate = (tpl: typeof EXAMPLE_TEMPLATES[0]) => {
    setData({
      claimant: "Test User",
      lob: tpl.lob,
      amount: tpl.amount,
      location: "",
      dateOfLoss: new Date().toISOString().slice(0, 10),
      policyId: tpl.policyId,
      narrative: tpl.narrative,
      documents: tpl.documents.map((d) => ({ ...d })),
      photos: tpl.photos.map((p) => ({ ...p })),
    });
    setExpanded(true);
  };

  const canRun = data.narrative.trim().length >= 20;

  const handleRun = () => {
    if (!canRun) return;
    onRunCustom(data);
    setExpanded(false);
  };

  return (
    <section id="custom" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-border">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Build Your Own Claim</h2>
          <p className="text-muted-foreground mt-1">
            Enter your own claim data — narrative, documents, photo descriptions — and run the pipeline on it.
          </p>
        </div>
        <Button
          variant={expanded ? "outline" : "default"}
          onClick={() => setExpanded((e) => !e)}
        >
          <Wand2 className="w-4 h-4 mr-1" />
          {expanded ? "Hide form" : "Create custom claim"}
        </Button>
      </div>

      {/* Quick templates */}
      <div className="mb-4">
        <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" /> QUICK TEMPLATES — click to auto-fill
        </div>
        <div className="flex gap-2 flex-wrap">
          {EXAMPLE_TEMPLATES.map((tpl) => (
            <Button
              key={tpl.label}
              variant="outline"
              size="sm"
              onClick={() => loadTemplate(tpl)}
              className="text-xs"
            >
              {tpl.label}
            </Button>
          ))}
        </div>
      </div>

      {expanded && (
        <Card className="fade-in-up">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Custom Claim Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Basic fields */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="claimant" className="text-xs">Claimant name</Label>
                <Input
                  id="claimant"
                  value={data.claimant}
                  onChange={(e) => update({ claimant: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lob" className="text-xs">Line of business</Label>
                <Select value={data.lob} onValueChange={(v: any) => update({ lob: v, policyId: v === "auto" ? "AUTO-PL-88231" : v === "homeowners" ? "HO-3-55109" : "CP-00-BB9912" })}>
                  <SelectTrigger id="lob" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="homeowners">Homeowners</SelectItem>
                    <SelectItem value="property">Commercial Property</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount" className="text-xs">Claim amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={data.amount || ""}
                  onChange={(e) => update({ amount: Number(e.target.value) })}
                  placeholder="e.g. 8420"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-xs">Location</Label>
                <Input
                  id="location"
                  value={data.location}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="e.g. Austin, TX"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateOfLoss" className="text-xs">Date of loss</Label>
                <Input
                  id="dateOfLoss"
                  type="date"
                  value={data.dateOfLoss}
                  onChange={(e) => update({ dateOfLoss: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="policyId" className="text-xs">Policy ID</Label>
                <Input
                  id="policyId"
                  value={data.policyId}
                  onChange={(e) => update({ policyId: e.target.value })}
                  placeholder="e.g. AUTO-PL-88231"
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Available: AUTO-PL-88231, AUTO-PL-77014, HO-3-55109, HO-3-44920, CP-00-BB9912, AUTO-PL-90117
                </p>
              </div>
            </div>

            <Separator />

            {/* Narrative — the key field */}
            <div>
              <Label htmlFor="narrative" className="text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Claim narrative
                <Badge variant="secondary" className="text-[10px] ml-1">required · min 20 chars</Badge>
              </Label>
              <Textarea
                id="narrative"
                value={data.narrative}
                onChange={(e) => update({ narrative: e.target.value })}
                placeholder="Describe what happened in the claimant's own words. e.g. 'I was rear-ended at a stoplight on Lamar Blvd...'"
                className="mt-1 min-h-[100px]"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{data.narrative.length} chars</p>
            </div>

            <Separator />

            {/* Documents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Documents (forms, estimates, reports)
                </Label>
                <Button variant="ghost" size="sm" onClick={addDoc} className="h-7 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add document
                </Button>
              </div>
              <div className="space-y-3">
                {data.documents.map((doc, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={doc.title}
                        onChange={(e) => {
                          const docs = [...data.documents];
                          docs[i] = { ...doc, title: e.target.value };
                          update({ documents: docs });
                        }}
                        placeholder="Document title (e.g. 'Repair Estimate')"
                        className="text-sm h-8"
                      />
                      {data.documents.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeDoc(i)} className="h-8 px-2 text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={doc.content}
                      onChange={(e) => {
                        const docs = [...data.documents];
                        docs[i] = { ...doc, content: e.target.value };
                        update({ documents: docs });
                      }}
                      placeholder="Paste the document text here — claim form fields, repair estimate line items, police report, etc."
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Photo evidence descriptions
                </Label>
                <Button variant="ghost" size="sm" onClick={addPhoto} className="h-7 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add photo
                </Button>
              </div>
              <div className="space-y-3">
                {data.photos.map((photo, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Textarea
                      value={photo.description}
                      onChange={(e) => {
                        const photos = [...data.photos];
                        photos[i] = { description: e.target.value };
                        update({ photos });
                      }}
                      placeholder="Describe what a photo would show — e.g. 'Rear bumper crushed inward 8 inches, tail lamps cracked, white paint transfer visible'"
                      className="text-sm min-h-[60px]"
                    />
                    {data.photos.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removePhoto(i)} className="h-8 px-2 mt-1 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Since this is a text-based demo, describe photos in words — the Vision Assessor agent will analyze the description as if it were analyzing the image.
              </p>
            </div>

            <Separator />

            {/* Run button */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {canRun ? (
                  <span className="text-primary flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" /> Ready to run — the pipeline will process your custom claim
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Enter a narrative (at least 20 characters) to run the pipeline
                  </span>
                )}
              </p>
              <Button onClick={handleRun} disabled={!canRun} size="lg" className="agent-pulse">
                <Play className="w-4 h-4 mr-2 fill-current" /> Run Pipeline on Custom Claim
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
