import { supabase } from "@/lib/supabaseClient";

const ENTITY_TABLES = {
  Customer: "customers",
  Invoice: "invoices",
  Payment: "payments",
  Product: "products",
  Sale: "sales",
  Settings: "settings",
  StockItem: "stock_items",
  StockMovement: "stock_movements",
  Supplier: "suppliers",
};

const SORT_FIELD_ALIASES = {
  created_date: "created_at",
};

const ENTITY_DEFAULT_SORT_FIELDS = {
  Invoice: "issue_date",
  Payment: "due_date",
  StockMovement: "movement_date",
};

function mapSortField(entityName, field) {
  if (!field) {
    return ENTITY_DEFAULT_SORT_FIELDS[entityName] || "created_at";
  }

  return SORT_FIELD_ALIASES[field] || field;
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") {
    return row;
  }

  const normalized = { ...row };

  if (!normalized.created_date && normalized.created_at) {
    normalized.created_date = normalized.created_at;
  }

  return normalized;
}

function buildEntityClient(entityName) {
  const table = ENTITY_TABLES[entityName];

  if (!table) {
    throw new Error(`Tabela não mapeada para a entidade ${entityName}`);
  }

  return {
    async list(sort = "-created_date", limit = 100) {
      const descending = typeof sort === "string" && sort.startsWith("-");
      const rawField =
        typeof sort === "string" ? sort.replace(/^-/, "") : undefined;
      const orderField = mapSortField(entityName, rawField);

      let query = supabase
        .from(table)
        .select("*")
        .order(orderField, { ascending: !descending, nullsFirst: false });

      if (typeof limit === "number" && Number.isFinite(limit)) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(normalizeRow);
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return normalizeRow(data);
    },

    async create(payload) {
      const insertPayload = {
        ...payload,
        ...(payload?.created_at ? {} : { created_at: new Date().toISOString() }),
      };

      const { data, error } = await supabase
        .from(table)
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return normalizeRow(data);
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return normalizeRow(data);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        throw error;
      }

      return { success: true };
    },
  };
}

async function uploadFileToSupabase({ file }) {
  if (!file) {
    throw new Error("Arquivo não informado.");
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : "bin";
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    throw new Error(
      'Falha ao enviar arquivo para o Supabase Storage. Verifique se o bucket "uploads" existe e permite upload.'
    );
  }

  const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);

  return {
    file_url: data.publicUrl,
    path: filePath,
  };
}

async function extractDataFromUploadedFile() {
  throw new Error(
    "A extração automática de nota fiscal dependia da integração Base44/Cline. Para usar apenas Supabase, será necessário criar uma Edge Function ou API própria para processamento do arquivo."
  );
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Usuário não autenticado.");
  }

  return data.user;
}

export const cline = {
  auth: {
    async me() {
      return getCurrentUser();
    },

    async logout() {
      await supabase.auth.signOut();
    },

    redirectToLogin() {
      window.location.href = "/";
    },
  },

  entities: {
    Customer: buildEntityClient("Customer"),
    Invoice: buildEntityClient("Invoice"),
    Payment: buildEntityClient("Payment"),
    Product: buildEntityClient("Product"),
    Sale: buildEntityClient("Sale"),
    Settings: buildEntityClient("Settings"),
    StockItem: buildEntityClient("StockItem"),
    StockMovement: buildEntityClient("StockMovement"),
    Supplier: buildEntityClient("Supplier"),
  },

  integrations: {
    Core: {
      UploadFile: uploadFileToSupabase,
      ExtractDataFromUploadedFile: extractDataFromUploadedFile,
    },
  },
};