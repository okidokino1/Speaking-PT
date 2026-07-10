// 어떤 외부 서비스가 설정되어 있는지 감지한다.
// 키가 없으면 앱은 "데모 모드"로 완전히 동작하고, 키가 채워지면 실제 서비스로 전환된다.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  openaiKey: process.env.OPENAI_API_KEY || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  portoneStoreId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "",
  portoneChannelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "",
  portoneApiSecret: process.env.PORTONE_API_SECRET || "",
  claudeModel: process.env.CLAUDE_MODEL || "claude-sonnet-5",
};

export const features = {
  get supabase() {
    return Boolean(env.supabaseUrl && env.supabaseAnonKey);
  },
  get whisper() {
    return Boolean(env.openaiKey);
  },
  get claude() {
    return Boolean(env.anthropicKey);
  },
  get portone() {
    return Boolean(env.portoneStoreId && env.portoneChannelKey);
  },
};

// 클라이언트 컴포넌트에서도 안전하게 노출 가능한 플래그
export const publicFeatures = {
  supabase: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  portone: Boolean(env.portoneStoreId && env.portoneChannelKey),
};
