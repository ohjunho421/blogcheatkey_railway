import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link } from "lucide-react";

interface ReferenceLinksProps {
  links: string[];
  citationsWithTitles?: Array<{url: string, title: string}>;
}

export function ReferenceLinks({ links, citationsWithTitles }: ReferenceLinksProps) {
  if (!links || links.length === 0) return null;

  const getDisplayInfo = (link: string, index: number) => {
    const citationInfo = citationsWithTitles?.find(c => c.url === link);
    if (citationInfo) {
      return { title: citationInfo.title, url: citationInfo.url };
    }
    
    // Fallback: extract domain name as title
    try {
      const domain = new URL(link).hostname.replace('www.', '');
      const title = domain.split('.')[0];
      return { 
        title: title.charAt(0).toUpperCase() + title.slice(1) + ' 자료',
        url: link 
      };
    } catch {
      return { title: `참고자료 ${index + 1}`, url: link };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Link className="h-5 w-5 text-primary mr-2" />
          참고 자료 출처
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links.map((link, index) => {
            const { title, url } = getDisplayInfo(link, index);
            return (
              <div key={index} className="flex items-start space-x-2 p-2 rounded border bg-muted/30">
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Button 
                    variant="link" 
                    className="text-primary hover:underline text-sm p-0 h-auto font-medium text-left"
                    onClick={() => window.open(url, '_blank')}
                  >
                    {title}
                  </Button>
                  <div className="text-xs text-muted-foreground mt-1 break-all">
                    {url}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
