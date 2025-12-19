import { Link } from "raviger";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

type BackButtonProps = {
  to?: string;
} & React.ComponentProps<typeof Button>;

export default function BackButton({ to, ...props }: BackButtonProps) {
  const { history } = useAppHistory();

  const href = to && history.length > 1 ? to : history[1];

  if (!href) {
    return;
  }

  return (
    <Button variant="outline" data-shortcut-id="go-back" asChild {...props}>
      <Link basePath="/" href={href}>
        {props.children}
      </Link>
    </Button>
  );
}
