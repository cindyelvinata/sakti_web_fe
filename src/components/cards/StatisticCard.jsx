import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import upIcon from "@/assets/icons/up_icons.svg";
import downIcon from "@/assets/icons/down_icons.svg";
export default function StatisticCard({ label, value, change, trend }) {
  const up = trend === "up";
  return (
    <Card className="h-[112px] w-full min-w-0 rounded-[14px] border border-[#B7DFE9] bg-[#EDF9FC] shadow-[0_1px_0_rgba(15,23,42,.03)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:h-[124px]">
      <CardContent className="relative flex h-full flex-col p-4 sm:p-[18px]">
        {change && (
          <Badge className="ml-auto gap-[2px] rounded-full bg-[#4F94AA] px-[9px] py-[4px] text-[10px] font-semibold leading-none text-white shadow-none">
            <img
              src={up ? upIcon : downIcon}
              alt=""
              className="size-[11px] brightness-0 invert"
            />
            {change}
          </Badge>
        )}
        <p className="mt-auto text-[34px] font-bold leading-none tracking-normal text-black sm:text-[42px]">
          {value}
        </p>
        <p className="mt-2 truncate text-[11px] font-medium leading-none text-slate-950 sm:text-[12px]">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}
