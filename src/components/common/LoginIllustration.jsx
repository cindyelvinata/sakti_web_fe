import { BriefcaseBusiness, Clock3, Monitor, Trash2 } from "lucide-react";
export default function LoginIllustration() {
  return (
    <div className="relative mx-auto h-[310px] w-full max-w-[460px] overflow-hidden">
      <div className="absolute left-[12%] top-[10%] h-[210px] w-[42%] rounded-sm border-[3px] border-slate-100 bg-white">
        <div className="absolute inset-x-0 top-0 h-[52px] border-b-[3px] border-slate-100" />
        <div className="absolute bottom-4 left-5 flex items-end gap-1 opacity-35">
          <i className="h-14 w-3 bg-slate-200" />
          <i className="h-24 w-4 bg-slate-200" />
          <i className="h-20 w-5 bg-slate-200" />
          <i className="h-28 w-4 bg-slate-200" />
          <i className="h-16 w-6 bg-slate-200" />
        </div>
      </div>
      <div className="absolute right-[15%] top-[6%] grid size-9 place-items-center rounded-full border-2 border-slate-100 text-slate-200">
        <Clock3 size={20} />
      </div>
      <div className="absolute right-[7%] top-[25%] h-[140px] w-[45%] rounded-sm bg-[#A9D9E3]">
        <div className="absolute left-[26%] top-8 h-4 w-[48%] bg-white" />
        <div className="absolute left-[26%] top-14 h-4 w-[48%] bg-white" />
        <div className="absolute left-[26%] top-22 h-5 w-[48%] bg-[#1E93AB]" />
      </div>
      <div className="absolute bottom-[10%] left-[16%] h-3 w-[58%] rounded-full bg-[#E62727]" />
      <div className="absolute bottom-0 left-[17%] h-28 w-28 rounded-full bg-[#1E93AB]/15" />
      <div className="absolute bottom-[2%] left-[26%] grid size-20 place-items-center rounded-full bg-[#1E93AB] text-white shadow-lg">
        <BriefcaseBusiness size={36} />
      </div>
      <div className="absolute bottom-[5%] right-[7%] grid size-16 place-items-center rounded-full bg-[#E62727]/10 text-[#E62727]">
        <Trash2 size={29} />
      </div>
      <div className="absolute bottom-[1%] right-[21%] grid size-14 place-items-center rounded-full bg-[#1E93AB]/10 text-[#1E93AB]">
        <Monitor size={26} />
      </div>
      <div className="absolute bottom-0 left-[4%] right-[3%] h-2 rounded-full bg-slate-100" />
    </div>
  );
}
