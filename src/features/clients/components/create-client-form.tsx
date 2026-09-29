"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import {
  startTransition,
  type FormEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createClientAction,
  updateClientAction,
} from "@/features/clients/actions";
import { initialCreateClientState } from "@/features/clients/client-state";
import {
  clientStatusOptions,
  healthStatusOptions,
} from "@/features/clients/constants";
import { cn } from "@/lib/utils";

type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
  active?: boolean;
};

type ProfileOption = {
  id: string;
  fullName: string;
};

type CreateClientFormProps = {
  services: ServiceOption[];
  profiles: ProfileOption[];
  defaultJoinedAt: string;
  defaultPrimaryMemberId: string;
};

export type EditClientValues = {
  name: string;
  legalName: string;
  cnpj: string;
  segment: string;
  city: string;
  state: string;
  websiteUrl: string;
  instagramUrl: string;
  googleBusinessUrl: string;
  status: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CLOSED";
  healthStatus: "HEALTHY" | "ATTENTION" | "CRITICAL" | "";
  joinedAt: string;
  acquisitionSource: string;
  soldByUserId: string;
  primaryMemberId: string;
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  contactEmail: string;
  generalNotes: string;
  internalNotes: string;
  services: Array<{ id: string; scope: string }>;
};

type EditClientFormProps = {
  clientId: string;
  services: ServiceOption[];
  profiles: ProfileOption[];
  values: EditClientValues;
};

type ClientFormProps = {
  mode: "create" | "edit";
  clientId?: string;
  services: ServiceOption[];
  profiles: ProfileOption[];
  values: EditClientValues;
};

const fieldClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-[color,border-color,box-shadow] hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-destructive/70 aria-invalid:ring-3 aria-invalid:ring-destructive/15";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function FormField({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
        {required ? <span className="ml-1 text-compass-purple-light">*</span> : null}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function ClientSubmitButton({ pending, mode }: { pending: boolean; mode: "create" | "edit" }) {
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
      {pending
        ? mode === "create" ? "Cadastrando..." : "Salvando..."
        : mode === "create" ? "Cadastrar cliente" : "Salvar alterações"}
    </Button>
  );
}

function ClientForm({
  mode,
  clientId,
  services,
  profiles,
  values,
}: ClientFormProps) {
  const action = mode === "edit" && clientId
    ? updateClientAction.bind(null, clientId)
    : createClientAction;
  const [actionState, dispatchAction, pending] = useActionState(
    action,
    initialCreateClientState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    values.services.map((service) => service.id),
  );
  const [clientStatus, setClientStatus] = useState(values.status);
  const serviceScopes = new Map(
    values.services.map((service) => [service.id, service.scope]),
  );

  useEffect(() => {
    if (actionState.status !== "error") return;

    const firstInvalidField = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    firstInvalidField?.focus();
  }, [actionState]);

  function toggleService(serviceId: string) {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  const error = (field: string) => actionState.fieldErrors?.[field]?.[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      dispatchAction(formData);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {actionState.status === "error" && actionState.message ? (
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl border border-status-critical/25 bg-status-critical/8 px-4 py-3 text-sm text-status-critical"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{actionState.message}</span>
        </div>
      ) : null}

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
          <CardTitle>Dados básicos</CardTitle>
          <CardDescription>
            Identificação e presença digital do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormField label="Nome fantasia" name="name" error={error("name")} required>
            <Input id="name" name="name" defaultValue={values.name} aria-invalid={Boolean(error("name"))} required />
          </FormField>
          <FormField label="Razão social" name="legalName" error={error("legalName")}>
            <Input id="legalName" name="legalName" defaultValue={values.legalName} aria-invalid={Boolean(error("legalName"))} />
          </FormField>
          <FormField label="CNPJ" name="cnpj" error={error("cnpj")}>
            <Input id="cnpj" name="cnpj" defaultValue={values.cnpj} inputMode="numeric" placeholder="00.000.000/0000-00" aria-invalid={Boolean(error("cnpj"))} />
          </FormField>
          <FormField label="Segmento" name="segment" error={error("segment")}>
            <Input id="segment" name="segment" defaultValue={values.segment} placeholder="Ex.: Educação, Saúde, Varejo" aria-invalid={Boolean(error("segment"))} />
          </FormField>
          <FormField label="Cidade" name="city" error={error("city")}>
            <Input id="city" name="city" defaultValue={values.city} aria-invalid={Boolean(error("city"))} />
          </FormField>
          <FormField label="Estado" name="state" error={error("state")}>
            <Input id="state" name="state" defaultValue={values.state} maxLength={2} className="uppercase" placeholder="SP" aria-invalid={Boolean(error("state"))} />
          </FormField>
          <FormField label="Site" name="websiteUrl" error={error("websiteUrl")}>
            <Input id="websiteUrl" name="websiteUrl" defaultValue={values.websiteUrl} type="url" placeholder="https://" aria-invalid={Boolean(error("websiteUrl"))} />
          </FormField>
          <FormField label="Instagram" name="instagramUrl" error={error("instagramUrl")}>
            <Input id="instagramUrl" name="instagramUrl" defaultValue={values.instagramUrl} type="url" placeholder="https://instagram.com/..." aria-invalid={Boolean(error("instagramUrl"))} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Google Meu Negócio" name="googleBusinessUrl" error={error("googleBusinessUrl")}>
              <Input id="googleBusinessUrl" name="googleBusinessUrl" defaultValue={values.googleBusinessUrl} type="url" placeholder="https://maps.google.com/..." aria-invalid={Boolean(error("googleBusinessUrl"))} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
          <CardTitle>Relacionamento com a Compass</CardTitle>
          <CardDescription>
            Situação operacional, entrada e pessoas responsáveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormField label="Data de entrada" name="joinedAt" error={error("joinedAt")} required>
            <Input id="joinedAt" name="joinedAt" type="date" defaultValue={values.joinedAt} aria-invalid={Boolean(error("joinedAt"))} required />
          </FormField>
          <FormField label="Status atual" name="status" error={error("status")} required>
            <select id="status" name="status" className={fieldClassName} value={clientStatus} onChange={(event) => setClientStatus(event.target.value as EditClientValues["status"])} aria-invalid={Boolean(error("status"))} required>
              {clientStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Saúde do cliente" name="healthStatus" error={error("healthStatus")} required={clientStatus === "ACTIVE"}>
            <select id="healthStatus" name="healthStatus" className={fieldClassName} defaultValue={values.healthStatus} aria-invalid={Boolean(error("healthStatus"))}>
              <option value="">Ainda não definida</option>
              {healthStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Responsável principal" name="primaryMemberId" error={error("primaryMemberId")} required>
            <select id="primaryMemberId" name="primaryMemberId" className={fieldClassName} defaultValue={values.primaryMemberId} aria-invalid={Boolean(error("primaryMemberId"))} required>
              <option value="" disabled>Selecione uma pessoa</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.fullName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Quem vendeu" name="soldByUserId" error={error("soldByUserId")}>
            <select id="soldByUserId" name="soldByUserId" className={fieldClassName} defaultValue={values.soldByUserId} aria-invalid={Boolean(error("soldByUserId"))}>
              <option value="">Não informado</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.fullName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Origem do cliente" name="acquisitionSource" error={error("acquisitionSource")}>
            <Input id="acquisitionSource" name="acquisitionSource" defaultValue={values.acquisitionSource} placeholder="Ex.: Indicação, evento, inbound" aria-invalid={Boolean(error("acquisitionSource"))} />
          </FormField>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "gap-0 py-0",
          error("serviceIds") && "border-destructive/60",
        )}
        aria-invalid={Boolean(error("serviceIds"))}
        tabIndex={error("serviceIds") ? -1 : undefined}
      >
        <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
          <CardTitle>Serviços contratados</CardTitle>
          <CardDescription>
            Selecione os serviços e registre o escopo específico quando necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          {services.map((service) => {
            const selected = selectedServices.includes(service.id);
            const wasInitiallySelected = values.services.some((item) => item.id === service.id);
            const canSelect = service.active !== false || wasInitiallySelected;
            return (
              <div key={service.id} className={cn("rounded-xl border p-4 transition-colors", selected ? "border-compass-purple-light/45 bg-compass-purple-soft" : "border-border bg-background-elevated/45 hover:border-border-strong")}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" name="serviceIds" value={service.id} checked={selected} onChange={() => toggleService(service.id)} disabled={!canSelect} className="mt-0.5 size-4 accent-compass-purple disabled:cursor-not-allowed disabled:opacity-50" />
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">{service.name}{service.active === false ? " · inativo" : ""}</span>
                    {service.description ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{service.description}</span> : null}
                  </span>
                </label>
                {selected ? (
                  <Textarea name={`serviceScope:${service.id}`} defaultValue={serviceScopes.get(service.id) ?? ""} className="mt-3 min-h-20 bg-background/45" placeholder="Descreva o escopo contratado para este serviço..." maxLength={2000} />
                ) : null}
              </div>
            );
          })}
          <div className="sm:col-span-2"><FieldError message={error("serviceIds")} /></div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
          <CardTitle>Contato principal</CardTitle>
          <CardDescription>
            Informações opcionais da pessoa de referência no cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormField label="Nome" name="contactName" error={error("contactName")}>
            <Input id="contactName" name="contactName" defaultValue={values.contactName} aria-invalid={Boolean(error("contactName"))} />
          </FormField>
          <FormField label="Cargo" name="contactPosition" error={error("contactPosition")}>
            <Input id="contactPosition" name="contactPosition" defaultValue={values.contactPosition} aria-invalid={Boolean(error("contactPosition"))} />
          </FormField>
          <FormField label="WhatsApp / telefone" name="contactPhone" error={error("contactPhone")}>
            <Input id="contactPhone" name="contactPhone" defaultValue={values.contactPhone} type="tel" placeholder="(11) 99999-9999" aria-invalid={Boolean(error("contactPhone"))} />
          </FormField>
          <FormField label="E-mail" name="contactEmail" error={error("contactEmail")}>
            <Input id="contactEmail" name="contactEmail" defaultValue={values.contactEmail} type="email" aria-invalid={Boolean(error("contactEmail"))} />
          </FormField>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
          <CardTitle>Observações</CardTitle>
          <CardDescription>
            Contexto geral e informações internas importantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormField label="Observações gerais" name="generalNotes" error={error("generalNotes")}>
            <Textarea id="generalNotes" name="generalNotes" defaultValue={values.generalNotes} maxLength={3000} aria-invalid={Boolean(error("generalNotes"))} />
          </FormField>
          <FormField label="Observações internas" name="internalNotes" error={error("internalNotes")}>
            <Textarea id="internalNotes" name="internalNotes" defaultValue={values.internalNotes} maxLength={3000} aria-invalid={Boolean(error("internalNotes"))} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end border-t border-border pt-5">
        <ClientSubmitButton pending={pending} mode={mode} />
      </div>
    </form>
  );
}

export function CreateClientForm({
  services,
  profiles,
  defaultJoinedAt,
  defaultPrimaryMemberId,
}: CreateClientFormProps) {
  return (
    <ClientForm
      mode="create"
      services={services}
      profiles={profiles}
      values={{
        name: "",
        legalName: "",
        cnpj: "",
        segment: "",
        city: "",
        state: "",
        websiteUrl: "",
        instagramUrl: "",
        googleBusinessUrl: "",
        status: "ONBOARDING",
        healthStatus: "",
        joinedAt: defaultJoinedAt,
        acquisitionSource: "",
        soldByUserId: "",
        primaryMemberId: defaultPrimaryMemberId,
        contactName: "",
        contactPosition: "",
        contactPhone: "",
        contactEmail: "",
        generalNotes: "",
        internalNotes: "",
        services: [],
      }}
    />
  );
}

export function EditClientForm({
  clientId,
  services,
  profiles,
  values,
}: EditClientFormProps) {
  return (
    <ClientForm
      mode="edit"
      clientId={clientId}
      services={services}
      profiles={profiles}
      values={values}
    />
  );
}
