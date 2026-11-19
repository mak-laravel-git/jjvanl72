import { Heart } from 'lucide-react';

export function AdminFooter() {
    return (
        <footer className="border-t bg-background/80 py-4 backdrop-blur-sm">
            <div className="container mx-auto flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <span>&copy; {new Date().getFullYear()}</span>
                <span className="mx-1">•</span>
                <span className="flex items-center gap-1">
                    Made with{' '}
                    <Heart className="h-3.5 w-3.5 animate-pulse fill-red-500 text-red-500" />{' '}
                    by
                    <a
                        href="https://maktechsolution.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary hover:underline"
                    >
                        MackTech Solution
                    </a>
                </span>
            </div>
        </footer>
    );
}
