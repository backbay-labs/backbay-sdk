import { edenTreaty } from "@elysiajs/eden";
import type {
  Attestation,
  AttestationRequest,
  HealthResponse,
  Incident,
  IncidentCreateRequest,
  IncidentVerifyRequest,
  LiveEvent,
  MeResponse,
  Node,
  Offer,
  OfferCreateRequest,
  ReadyResponse,
  SuccessResponse,
  Task,
  TaskClaimRequest,
  TaskCompleteRequest,
  TaskCreateRequest,
} from "@backbay/contract";

// Eden client type - uses dynamic property access for API routes
// The BFF server type is external, so we use a permissive type here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EdenClient = ReturnType<typeof edenTreaty<any>> & Record<string, any>;

type CreateServerApiOptions = {
  baseUrl?: string;
  getToken?: (() => Promise<string | null> | string | null) | null;
  getCookies?: (() => Promise<string | null> | string | null) | null;
};

async function resolveHeaders(
  getToken?: CreateServerApiOptions["getToken"],
  getCookies?: CreateServerApiOptions["getCookies"]
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const token = typeof getToken === "function" ? await getToken() : (getToken ?? null);
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const cookieValue = typeof getCookies === "function" ? await getCookies() : (getCookies ?? null);
  if (cookieValue) headers["Cookie"] = cookieValue;

  return headers;
}

function toError(edenError: unknown): Error {
  if (edenError instanceof Error) return edenError;
  if (typeof edenError === "object" && edenError !== null) {
    const e = edenError as Record<string, unknown>;
    if (e.value && typeof e.value === "object") {
      const value = e.value as Record<string, unknown>;
      const message = value.message ?? value.error ?? JSON.stringify(value);
      const error = new Error(String(message));
      (error as unknown as Record<string, unknown>).status = e.status;
      (error as unknown as Record<string, unknown>).value = value;
      return error;
    }
    if (e.message) return new Error(String(e.message));
  }
  return new Error("API request failed");
}

export const createServerApi = (opts: CreateServerApiOptions = {}) => {
  const baseUrl =
    opts.baseUrl ?? process.env.BACKBAY_BFF_URL ?? process.env.NEXT_PUBLIC_BACKBAY_BFF_URL;

  if (!baseUrl) {
    throw new Error("BACKBAY_BFF_URL is required to create the Backbay API client.");
  }

  // Cast to permissive type since BFF server types are external
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = edenTreaty(baseUrl) as EdenClient;

  return {
    system: {
      health: async (): Promise<HealthResponse> => {
        const res = await client.api.v1.system.health.get();
        if (res.error) throw toError(res.error);
        return (res.data as SuccessResponse<HealthResponse>).data;
      },
      ready: async (): Promise<ReadyResponse> => {
        const res = await client.api.v1.system.ready.get();
        if (res.error) throw toError(res.error);
        return (res.data as SuccessResponse<ReadyResponse>).data;
      },
    },

    me: {
      get: async (): Promise<MeResponse> => {
        const headers = await resolveHeaders(opts.getToken, opts.getCookies);
        const res = await client.api.v1.me.get({ headers });
        if (res.error) throw toError(res.error);
        return (res.data as SuccessResponse<MeResponse>).data;
      },
    },

    live: {
      list: async (): Promise<LiveEvent[]> => {
        const headers = await resolveHeaders(opts.getToken, opts.getCookies);
        const res = await client.api.v1.live.events.get({ headers });
        if (res.error) throw toError(res.error);
        return (res.data as SuccessResponse<LiveEvent[]>).data;
      },
    },

    nodes: {
      list: async (): Promise<Node[]> => {
        const headers = await resolveHeaders(opts.getToken, opts.getCookies);
        const res = await client.api.v1.nodes.get({ headers });
        if (res.error) throw toError(res.error);
        return (res.data as SuccessResponse<Node[]>).data;
      },
    },

    ops: {
      jobs: {
        list: async (query?: { status?: string; type?: string; limit?: number }) => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.v1.ops.jobs.get({ headers, query });
          if (res.error) throw toError(res.error);
          return (res.data as SuccessResponse<unknown>).data as unknown;
        },
        get: async (id: string) => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.v1.ops.jobs({ id }).get({ headers });
          if (res.error) throw toError(res.error);
          return (res.data as SuccessResponse<unknown>).data as unknown;
        },
      },
      stats: async () => {
        const headers = await resolveHeaders(opts.getToken, opts.getCookies);
        const res = await client.api.v1.ops.stats.get({ headers });
        if (res.error) throw toError(res.error);
        return (res.data as SuccessResponse<unknown>).data as unknown;
      },
    },

    verify: {
      receipts: {
        list: async (query?: {
          status?: string;
          node_id?: string;
          job_id?: string;
          limit?: number;
        }) => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.v1.verify.receipts.get({ headers, query });
          if (res.error) throw toError(res.error);
          return (res.data as SuccessResponse<unknown>).data as unknown;
        },
        get: async (id: string) => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.v1.verify.receipts({ id }).get({ headers });
          if (res.error) throw toError(res.error);
          return (res.data as SuccessResponse<unknown>).data as unknown;
        },
      },
      disputes: {
        list: async () => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.v1.verify.disputes.get({ headers });
          if (res.error) throw toError(res.error);
          return (res.data as SuccessResponse<unknown>).data as unknown;
        },
      },
    },

    market: {
      offers: {
        list: async (query?: { type?: Offer["offer_type"] }): Promise<Offer[]> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.offers.get({ headers, query });
          if (res.error) throw toError(res.error);
          return res.data as Offer[];
        },
        create: async (body: OfferCreateRequest): Promise<Offer> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.offers.post({ headers, body });
          if (res.error) throw toError(res.error);
          return res.data as Offer;
        },
        get: async (offer_id: string): Promise<Offer> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.offers({ offer_id }).get({ headers });
          if (res.error) throw toError(res.error);
          return res.data as Offer;
        },
      },
      tasks: {
        create: async (body: TaskCreateRequest): Promise<Task> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.tasks.post({ headers, body });
          if (res.error) throw toError(res.error);
          return res.data as Task;
        },
        get: async (task_id: string): Promise<Task> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.tasks({ task_id }).get({ headers });
          if (res.error) throw toError(res.error);
          return res.data as Task;
        },
        claim: async (task_id: string, body: TaskClaimRequest): Promise<Task> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.tasks({ task_id }).claim.post({ headers, body });
          if (res.error) throw toError(res.error);
          return res.data as Task;
        },
        complete: async (task_id: string, body: TaskCompleteRequest): Promise<Task> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.tasks({ task_id }).complete.post({ headers, body });
          if (res.error) throw toError(res.error);
          return res.data as Task;
        },
      },
      verifier: {
        tasks: {
          list: async (query?: { status?: "open" | "claimed" | "completed" }): Promise<Task[]> => {
            const headers = await resolveHeaders(opts.getToken, opts.getCookies);
            const res = await client.api.market.verifier.tasks.get({ headers, query });
            if (res.error) throw toError(res.error);
            return res.data as Task[];
          },
          attest: async (task_id: string, body: AttestationRequest): Promise<Attestation> => {
            const headers = await resolveHeaders(opts.getToken, opts.getCookies);
            const res = await client.api.market.verifier
              .tasks({ task_id })
              .attest.post({ headers, body });
            if (res.error) throw toError(res.error);
            return res.data as Attestation;
          },
        },
      },
      incidents: {
        create: async (body: IncidentCreateRequest): Promise<Incident> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.incidents.post({ headers, body });
          if (res.error) throw toError(res.error);
          return res.data as Incident;
        },
        get: async (incident_id: string): Promise<Incident> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market.incidents({ incident_id }).get({ headers });
          if (res.error) throw toError(res.error);
          return res.data as Incident;
        },
        verify: async (incident_id: string, body: IncidentVerifyRequest): Promise<Incident> => {
          const headers = await resolveHeaders(opts.getToken, opts.getCookies);
          const res = await client.api.market
            .incidents({ incident_id })
            .verify.post({ headers, body });
          if (res.error) throw toError(res.error);
          return res.data as Incident;
        },
      },
    },
  };
};
