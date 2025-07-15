import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link } from "lucide-react";

interface ReferenceLinksProps {
  links: string[];
}

export function ReferenceLinks({ links }: ReferenceLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Link className="h-5 w-5 text-primary mr-2" />
          참고 자료 출처
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={index} className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Button 
                variant="link" 
                className="text-primary hover:underline text-sm p-0 h-auto"
                onClick={() => window.open(link, '_blank')}
              >
                {link}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
