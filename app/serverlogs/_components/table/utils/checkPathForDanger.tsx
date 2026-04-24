import { Skull } from "lucide-react";

export interface DangerousPattern {
  pattern: RegExp;
  label: string;
  category:
    | "sensitive"
    | "exploit"
    | "config"
    | "backup"
    | "internal"
    | "potential exploit";
}

export const DEFAULT_DANGEROUS_PATTERNS: DangerousPattern[] = [
  {
    pattern: /\.env$/i,
    label: "Environment file",
    category: "sensitive",
  },
  {
    pattern: /\.env\.\w+$/i,
    label: "Environment file",
    category: "sensitive",
  },
  {
    pattern: /\.env\.prod(?:uction)?$/i,
    label: "Production env",
    category: "sensitive",
  },
  {
    pattern: /\.env\.staging$/i,
    label: "Staging env",
    category: "sensitive",
  },
  {
    pattern: /\.env\.local$/i,
    label: "Local env",
    category: "sensitive",
  },
  {
    pattern: /\.env\.dev(?:elopment)?$/i,
    label: "Dev env",
    category: "sensitive",
  },
  {
    pattern: /\.env\.prod$/i,
    label: "Prod env",
    category: "sensitive",
  },
  {
    pattern: /\.env\.production$/i,
    label: "Production env",
    category: "sensitive",
  },
  {
    pattern: /\.json(?:eger)?$/i,
    label: "JSON config",
    category: "config",
  },
  {
    pattern: /config\./i,
    label: "Config file",
    category: "config",
  },
  {
    pattern: /\.conf(?:ig)?$/i,
    label: "Config file",
    category: "config",
  },
  {
    pattern: /\.ini$/i,
    label: "INI config",
    category: "config",
  },
  {
    pattern: /\.xml$/i,
    label: "XML config",
    category: "config",
  },
  {
    pattern: /\.yml$/i,
    label: "YAML config",
    category: "config",
  },
  {
    pattern: /\.yaml$/i,
    label: "YAML config",
    category: "config",
  },
  {
    pattern: /\.toml$/i,
    label: "TOML config",
    category: "config",
  },
  {
    pattern: /wp-config\.php/i,
    label: "WordPress config",
    category: "config",
  },
  {
    pattern: /\.sql$/i,
    label: "SQL dump",
    category: "backup",
  },
  {
    pattern: /\.bak$/i,
    label: "Backup file",
    category: "backup",
  },
  {
    pattern: /\.old$/i,
    label: "Old file",
    category: "backup",
  },
  {
    pattern: /\.(?:tar|gz|zip|rar|7z)$/i,
    label: "Archive",
    category: "backup",
  },
  {
    pattern: /\.dump$/i,
    label: "Database dump",
    category: "backup",
  },
  {
    pattern: /\~$/i,
    label: "Backup/temp",
    category: "backup",
  },
  {
    pattern: /(?:^|\/)\.git\//i,
    label: "Git folder",
    category: "internal",
  },
  {
    pattern: /(?:^|\/)\.svn\//i,
    label: "SVN folder",
    category: "internal",
  },
  {
    pattern: /(?:\/|%2e)%2e(?:\/|%2e)/i,
    label: "Path traversal",
    category: "exploit",
  },
  {
    pattern: /\.\.(?:\/|%2f)/i,
    label: "Path traversal",
    category: "exploit",
  },
  {
    pattern: /\.\.\//i,
    label: "Path traversal",
    category: "exploit",
  },
  {
    pattern: /\.\.%2f/i,
    label: "Path traversal",
    category: "exploit",
  },
  {
    pattern: /etc\/passwd/i,
    label: "Passwd file",
    category: "exploit",
  },
  {
    pattern: /etc\/shadow/i,
    label: "Shadow file",
    category: "exploit",
  },
  {
    pattern: /wp-admin/i,
    label: "WP admin",
    category: "exploit",
  },
  {
    pattern: /wp-login/i,
    label: "WP login",
    category: "exploit",
  },
  {
    pattern: /\.\.\//i,
    label: "Directory traversal",
    category: "exploit",
  },
  {
    pattern: /\/cgi-bin\//i,
    label: "CGI bin",
    category: "exploit",
  },
  {
    pattern: /\/cgi\//i,
    label: "CGI",
    category: "exploit",
  },
  {
    pattern: /\.php(?:5|6|7|8)?(?:\?|$)/i,
    label: "PHP file",
    category: "exploit",
  },
  {
    pattern: /\beval\s*\(/i,
    label: "Eval usage",
    category: "exploit",
  },
  {
    pattern: /\bbase64_decode\b/i,
    label: "Base64 decode",
    category: "exploit",
  },
  {
    pattern: /\bshell_exec\b/i,
    label: "Shell exec",
    category: "exploit",
  },
  {
    pattern: /\bsystem\b/i,
    label: "System call",
    category: "exploit",
  },
  {
    pattern: /\bexec\b/i,
    label: "Exec",
    category: "exploit",
  },
  {
    pattern: /\bpassthru\b/i,
    label: "Passthru",
    category: "exploit",
  },
  {
    pattern: /proc\/self/i,
    label: "Proc access",
    category: "exploit",
  },
  {
    pattern: /\/etc\/hosts/i,
    label: "Hosts file",
    category: "exploit",
  },
  {
    pattern: /\.aws\/credentials/i,
    label: "AWS creds",
    category: "sensitive",
  },
  {
    pattern: /\/id_rsa/i,
    label: "SSH key",
    category: "sensitive",
  },
  {
    pattern: /\/id_dsa/i,
    label: "SSH key",
    category: "sensitive",
  },
  {
    pattern: /\.pem$/i,
    label: "Private key",
    category: "sensitive",
  },
  {
    pattern: /\.key$/i,
    label: "Private key",
    category: "sensitive",
  },
  {
    pattern: /\.htaccess/i,
    label: "HTaccess",
    category: "config",
  },
  {
    pattern: /\.htpasswd/i,
    label: "HTpasswd",
    category: "sensitive",
  },
  {
    pattern: /\.gitignore/i,
    label: "Git ignore",
    category: "internal",
  },
  {
    pattern: /\.DS_Store/i,
    label: "OS file",
    category: "internal",
  },
  {
    pattern: /phpinfo/i,
    label: "PHPInfo",
    category: "exploit",
  },
  {
    pattern: /info\.php/i,
    label: "PHPInfo",
    category: "exploit",
  },
  {
    pattern: /test\.php/i,
    label: "Test PHP",
    category: "exploit",
  },
  {
    pattern: /\.asax?$/i,
    label: "ASP.NET",
    category: "exploit",
  },
  {
    pattern: /\.asmx$/i,
    label: "ASMX",
    category: "exploit",
  },
  {
    pattern: /\.(?:asp|aspx)$/i,
    label: "ASP file",
    category: "exploit",
  },
  {
    pattern: /\.jsp$/i,
    label: "JSP file",
    category: "exploit",
  },
  {
    pattern: /\.do$/i,
    label: "Java servlet",
    category: "exploit",
  },
  {
    pattern: /\/admin(?:istrator)?/i,
    label: "Admin path",
    category: "exploit",
  },
  {
    pattern: /\/manage(?:ment)?/i,
    label: "Management",
    category: "exploit",
  },
  {
    pattern: /\/phpmyadmin/i,
    label: "PHPMyAdmin",
    category: "exploit",
  },
  {
    pattern: /\/mysql/i,
    label: "MySQL",
    category: "exploit",
  },
  {
    pattern: /\/database/i,
    label: "Database",
    category: "exploit",
  },
  {
    pattern: /\.log$/i,
    label: "Log file",
    category: "internal",
  },
  {
    pattern: /\/logs?\//i,
    label: "Logs folder",
    category: "internal",
  },
  {
    pattern: /\.cache$/i,
    label: "Cache",
    category: "internal",
  },
  {
    pattern: /\/tmp\//i,
    label: "Temp folder",
    category: "internal",
  },
  {
    pattern: /\/temp\//i,
    label: "Temp folder",
    category: "internal",
  },
  {
    pattern: /\.(?:swp|swo|swn)$/i,
    label: "Swap file",
    category: "backup",
  },
  {
    pattern: /\.orig$/i,
    label: "Original file",
    category: "backup",
  },
  {
    pattern: /\.save$/i,
    label: "Saved file",
    category: "backup",
  },
  {
    pattern: /\.copy$/i,
    label: "Copy file",
    category: "backup",
  },
  {
    pattern: /\.tmp$/i,
    label: "Temp file",
    category: "backup",
  },
  {
    pattern: /\/\.well-known\//i,
    label: "Well-known",
    category: "internal",
  },
  {
    pattern: /\/\.ssh\//i,
    label: "SSH folder",
    category: "sensitive",
  },
  {
    pattern: /\/wp-json\//i,
    label: "WP REST API",
    category: "exploit",
  },
  {
    pattern: /\/wp-json\/oembed/i,
    label: "WP oEmbed",
    category: "exploit",
  },
  {
    pattern: /\/xmlrpc\.php/i,
    label: "XML-RPC",
    category: "exploit",
  },
  {
    pattern: /\/feed\/?$/i,
    label: "RSS feed",
    category: "internal",
  },
  {
    pattern: /\/sitemap\.xml/i,
    label: "Sitemap",
    category: "internal",
  },
  {
    pattern: /\/\.well-known\/acme-challenge/i,
    label: "ACME challenge",
    category: "internal",
  },
  {
    pattern: /\beval\s*\(/i,
    label: "Eval usage",
    category: "exploit",
  },
  {
    pattern: /\bbase64_decode\b/i,
    label: "Base64 decode",
    category: "exploit",
  },
  {
    pattern: /\bshell_exec\b/i,
    label: "Shell exec",
    category: "exploit",
  },
  {
    pattern: /\bsystem\b/i,
    label: "System call",
    category: "exploit",
  },
  {
    pattern: /\bexec\b/i,
    label: "Exec",
    category: "exploit",
  },
  {
    pattern: /\bpassthru\b/i,
    label: "Passthru",
    category: "exploit",
  },
  {
    pattern: /proc\/self/i,
    label: "Proc access",
    category: "exploit",
  },
  {
    pattern: /\/etc\/hosts/i,
    label: "Hosts file",
    category: "exploit",
  },
  {
    pattern: /\.aws\/credentials/i,
    label: "AWS creds",
    category: "sensitive",
  },
  {
    pattern: /\/id_rsa/i,
    label: "SSH key",
    category: "sensitive",
  },
  {
    pattern: /\/id_dsa/i,
    label: "SSH key",
    category: "sensitive",
  },
  {
    pattern: /\.pem$/i,
    label: "Private key",
    category: "sensitive",
  },
  {
    pattern: /\.key$/i,
    label: "Private key",
    category: "sensitive",
  },
  {
    pattern: /\.htaccess/i,
    label: "HTaccess",
    category: "config",
  },
  {
    pattern: /\.htpasswd/i,
    label: "HTpasswd",
    category: "sensitive",
  },
  {
    pattern: /\.gitignore/i,
    label: "Git ignore",
    category: "internal",
  },
  {
    pattern: /\.DS_Store/i,
    label: "OS file",
    category: "internal",
  },
  {
    pattern: /phpinfo/i,
    label: "PHPInfo",
    category: "potential exploit",
  },
  {
    pattern: /info\.php/i,
    label: "PHPInfo",
    category: "potential exploit",
  },
  {
    pattern: /test\.php/i,
    label: "Test PHP",
    category: "potential exploit",
  },
  {
    pattern: /\.asax?$/i,
    label: "ASP.NET",
    category: "exploit",
  },
  {
    pattern: /\.asmx$/i,
    label: "ASMX",
    category: "exploit",
  },
  {
    pattern: /\.(?:asp|aspx)$/i,
    label: "ASP file",
    category: "exploit",
  },
  {
    pattern: /\.jsp$/i,
    label: "JSP file",
    category: "exploit",
  },
  {
    pattern: /\.do$/i,
    label: "Java servlet",
    category: "exploit",
  },
  {
    pattern: /\/admin(?:istrator)?/i,
    label: "Admin path",
    category: "exploit",
  },
  {
    pattern: /\/manage(?:ment)?/i,
    label: "Management",
    category: "exploit",
  },
  {
    pattern: /\/phpmyadmin/i,
    label: "PHPMyAdmin",
    category: "exploit",
  },
  {
    pattern: /\/mysql/i,
    label: "MySQL",
    category: "exploit",
  },
  {
    pattern: /\/database/i,
    label: "Database",
    category: "exploit",
  },
  {
    pattern: /\.log$/i,
    label: "Log file",
    category: "internal",
  },
  {
    pattern: /\/logs?\//i,
    label: "Logs folder",
    category: "internal",
  },
  {
    pattern: /\.cache$/i,
    label: "Cache",
    category: "internal",
  },
  {
    pattern: /\/tmp\//i,
    label: "Temp folder",
    category: "internal",
  },
  {
    pattern: /\/temp\//i,
    label: "Temp folder",
    category: "internal",
  },
  {
    pattern: /\.(?:swp|swo|swn)$/i,
    label: "Swap file",
    category: "backup",
  },
  {
    pattern: /\.orig$/i,
    label: "Original file",
    category: "backup",
  },
  {
    pattern: /\.save$/i,
    label: "Saved file",
    category: "backup",
  },
  {
    pattern: /\.copy$/i,
    label: "Copy file",
    category: "backup",
  },
  {
    pattern: /\.tmp$/i,
    label: "Temp file",
    category: "backup",
  },
  {
    pattern: /\/\.well-known\//i,
    label: "Well-known",
    category: "internal",
  },
  {
    pattern: /\/\.ssh\//i,
    label: "SSH folder",
    category: "sensitive",
  },
  {
    pattern: /wp-login/i,
    label: "WP login",
    category: "exploit",
  },
  {
    pattern: /\.php(?:5|6|7|8)?(?:\?|$)/i,
    label: "PHP file",
    category: "potential exploit",
  },
];

export interface DangerMatch {
  matched: boolean;
  label?: string;
  category?: DangerousPattern["category"];
}

export function checkPathForDanger(
  path: string,
  patterns: DangerousPattern[] = DEFAULT_DANGEROUS_PATTERNS,
): DangerMatch {
  if (!path) {
    return { matched: false };
  }

  for (const { pattern, label, category } of patterns) {
    if (pattern.test(path)) {
      return { matched: true, label, category };
    }
  }

  return { matched: false };
}

export function DangerIndicator({
  path,
  patterns,
  showTooltip = true,
}: {
  path: string;
  patterns?: DangerousPattern[];
  showTooltip?: boolean;
}) {
  const { matched, label, category } = checkPathForDanger(path, patterns);

  if (!matched || !label) {
    return null;
  }

  const categoryColors: Record<
    DangerousPattern["category"],
    { bg: string; text: string }
  > = {
    sensitive: { bg: "bg-red-100", text: "text-red-800" },
    exploit: { bg: "bg-red-500", text: "text-white" },
    config: { bg: "bg-yellow-100", text: "text-yellow-800" },
    backup: { bg: "bg-orange-100", text: "text-orange-800" },
    internal: { bg: "bg-gray-100", text: "text-gray-800" },
    "potential exploit": { bg: "bg-gray-100", text: "text-gray-800" },
  };

  const colors = categoryColors[category || "internal"];

  return (
    <span
      className={`inline-flex items-center ${colors.bg} ${colors.text} text-[9px] px-1.5  rounded-tr-lg rounded-bl-lg mt-0.5 ml-2 py-0`}
      title={showTooltip ? `${label} (${category})` : undefined}
    >
      <Skull size={10} className="mr-0.5" />
      {label}
    </span>
  );
}
