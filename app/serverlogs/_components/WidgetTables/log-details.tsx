import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface LogDetailsProps {
  log: any;
  isOpen: boolean;
  onClose: () => void;
}

export function LogDetails({ log, isOpen, onClose }: LogDetailsProps) {
  if (!log) return null;

  // Helper function to determine if a user agent is likely a bot
  const isBot = (userAgent: string) => {
    const botPatterns = [
      "bot",
      "crawler",
      "spider",
      "slurp",
      "baiduspider",
      "yandex",
      "googlebot",
      "bingbot",
      "rogerbot",
    ];
    const lowerCaseUA = userAgent.toLowerCase();
    return botPatterns.some((pattern) => lowerCaseUA.includes(pattern));
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  // Get status code badge color
  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return "bg-green-500";
    if (code >= 300 && code < 400) return "bg-blue-500";
    if (code >= 400 && code < 500) return "bg-yellow-500";
    if (code >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Log Entry #{log.id}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  IP Address
                </h3>
                <p>{log.ip}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Timestamp
                </h3>
                <p>{formatDate(log.timestamp)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Method
                </h3>
                <Badge
                  variant="outline"
                  className={
                    log.method === "GET"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : log.method === "POST"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : log.method === "PUT"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {log.method}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status Code
                </h3>
                <Badge
                  className={`${getStatusCodeColor(log.statusCode)} text-white`}
                >
                  {log.statusCode}
                </Badge>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Path
                </h3>
                <p className="break-all">{log.path}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Response Size
                </h3>
                <p>{log.responseSize} bytes</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Response Time
                </h3>
                <p>{log.responseTime} ms</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Referer
                </h3>
                <p>{log.referer}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  User Agent
                </h3>
                <p className="text-sm break-all">{log.userAgent}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Bot/Human
                </h3>
                <Badge
                  variant="outline"
                  className={
                    isBot(log.userAgent)
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : "bg-green-100 text-green-800 border-green-200"
                  }
                >
                  {isBot(log.userAgent) ? "Bot" : "Human"}
                </Badge>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
