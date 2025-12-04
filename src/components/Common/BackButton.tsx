import { Link } from "raviger";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

type BackButtonProps = {
  to?: string;
} & React.ComponentProps<typeof Button>;

export default function BackButton({ to, ...props }: BackButtonProps) {
  const { goBack, history } = useAppHistory();

  if (to) {
    return (
      <Button variant="outline" data-shortcut-id="go-back" asChild {...props}>
        <Link href={to}>{props.children}</Link>
      </Button>
    );
  }

  if (history.length <= 1) {
    return null;
  }

  return (
    <Button
      variant="outline"
      data-shortcut-id="go-back"
      onClick={() => {
        goBack();
      }}
      {...props}
    />
  );
}
