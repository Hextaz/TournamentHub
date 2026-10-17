import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Server } from "lucide-react";
import type { ServerSettings } from "@hub/shared";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getViewer, type DiscordGuildSummary } from "@/lib/viewer";
import {
  buildBotInviteUrl,
  canManageFromOAuth,
  isServerSetupComplete,
  serverCardState,
  type ServerCardState,
} from "@/lib/accessRules";
import { guildIconUrl } from "@/components/OrganizerCard";
import { t } from "@/i18n";
import { getServerLocale } from "@/i18n/server";
import type { Locale, TranslationKey } from "@/i18n/types";

interface ServerCard {
  guild: DiscordGuildSummary;
  state: ServerCardState;
}

const STATE_ORDER: Record<ServerCardState, number> = { setup: 0, install: 1, ready: 2, view: 3 };
const STATE_STYLE: Record<ServerCardState, string> = {
  install: "bg-slate-700/40 text-slate-300",
  setup: "bg-amber-500/10 text-amber-400",
  ready: "bg-emerald-500/10 text-emerald-400",
  view: "bg-blue-500/10 text-blue-400",
};
const STATE_LABEL: Record<ServerCardState, TranslationKey> = {
  install: "servers.stateInstall",
  setup: "servers.stateSetup",
  ready: "servers.stateReady",
  view: "servers.stateView",
};

async function loadCards(guilds: DiscordGuildSummary[], discordId: string): Promise<ServerCard[]> {
  const ids = guilds.map((g) => g.id);
  const [settingsRes, adminRes] = await Promise.all([
    supabaseAdmin.from("server_settings").select("*").in("guild_id", ids),
    supabaseAdmin.from("guild_admins").select("guild_id").eq("discord_id", discordId),
  ]);
  if (settingsRes.error) throw new Error(`server_settings read failed: ${settingsRes.error.message}`);
  if (adminRes.error) throw new Error(`guild_admins read failed: ${adminRes.error.message}`);

  const settings = new Map(((settingsRes.data ?? []) as ServerSettings[]).map((s) => [s.guild_id, s]));
  // Le rôle TO n'apparaît pas dans l'OAuth Discord : guild_admins (synchronisée par le bot) le complète.
  const adminOf = new Set((adminRes.data ?? []).map((row) => row.guild_id as string));

  return guilds
    .flatMap((guild): ServerCard[] => {
      const profile = settings.get(guild.id) ?? null;
      const state = serverCardState({
        botPresent: profile?.bot_present ?? false,
        canManage: canManageFromOAuth(guild) || adminOf.has(guild.id),
        setupComplete: isServerSetupComplete(profile),
      });
      return state ? [{ guild, state }] : [];
    })
    .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.guild.name.localeCompare(b.guild.name));
}

function PrimaryAction({ card, locale }: { card: ServerCard; locale: Locale }) {
  const className =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors w-full sm:w-auto";
  const { guild, state } = card;

  if (state === "install") {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) return null;
    return (
      <a href={buildBotInviteUrl(clientId, guild.id)} target="_blank" rel="noopener noreferrer" className={`${className} bg-indigo-600 hover:bg-indigo-500 text-white`}>
        {t(locale, "servers.actionInstall")} <ExternalLink className="w-4 h-4" />
      </a>
    );
  }
  if (state === "setup") {
    return (
      <Link href={`/admin/${guild.id}/settings`} className={`${className} bg-amber-600 hover:bg-amber-500 text-white`}>
        {t(locale, "servers.actionSetup")}
      </Link>
    );
  }
  if (state === "ready") {
    return (
      <Link href={`/admin/${guild.id}`} className={`${className} bg-blue-600 hover:bg-blue-500 text-white`}>
        {t(locale, "servers.actionManage")}
      </Link>
    );
  }
  return (
    <Link href={`/${guild.id}`} className={`${className} bg-slate-700 hover:bg-slate-600 text-white`}>
      {t(locale, "servers.actionView")}
    </Link>
  );
}

export default async function ServersPage() {
  const locale = await getServerLocale();
  const viewer = await getViewer();
  if (!viewer.discordId) redirect("/");

  if (viewer.guildsError || !viewer.guilds) {
    return (
      <div className="p-8 text-center text-red-400 font-medium bg-red-950/30 border border-red-900/50 mt-12 rounded-xl max-w-xl mx-4 sm:mx-auto">
        <p>{t(locale, "servers.sessionExpired")}</p>
        <Link href="/servers" className="mt-4 inline-block underline">
          {t(locale, "access.retry")}
        </Link>
      </div>
    );
  }

  const cards = await loadCards(viewer.guilds, viewer.discordId);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#0a0a0f] p-4 sm:p-8 pt-12 text-slate-200">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{t(locale, "servers.title")}</h1>
          <p className="text-slate-400 mt-3 text-lg max-w-2xl">{t(locale, "servers.subtitle")}</p>
        </div>

        {cards.length === 0 ? (
          <div className="bg-[#151722] p-12 text-center rounded-2xl border border-slate-800/50 max-w-xl mx-auto">
            <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-200">{t(locale, "servers.noServersFound")}</h2>
            <p className="text-slate-400 mt-4 leading-relaxed">{t(locale, "servers.noServersDesc")}</p>
            <Link href="/tournaments" className="mt-6 inline-block text-blue-400 hover:text-blue-300 font-semibold">
              {t(locale, "home.browseTournaments")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => {
              const icon = guildIconUrl(card.guild.id, card.guild.icon);
              return (
                <div key={card.guild.id} className="bg-[#151722] rounded-2xl border border-slate-800/50 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={icon} alt="" className="w-14 h-14 rounded-xl bg-slate-800 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#1a1d2d] flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-slate-300">{card.guild.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-100 truncate" title={card.guild.name}>
                        {card.guild.name}
                      </h3>
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${STATE_STYLE[card.state]}`}>
                        {t(locale, STATE_LABEL[card.state])}
                      </span>
                    </div>
                  </div>
                  {card.state === "install" && <p className="text-xs text-slate-500">{t(locale, "servers.installHint")}</p>}
                  <div className="mt-auto flex flex-col sm:flex-row gap-2">
                    <PrimaryAction card={card} locale={locale} />
                    {(card.state === "setup" || card.state === "ready") && (
                      <Link href={`/${card.guild.id}`} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                        {t(locale, "servers.actionView")}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
