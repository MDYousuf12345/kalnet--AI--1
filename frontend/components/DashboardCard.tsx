import { ReactNode } from "react";

type Props = {

  title: string;

  value: string;

  color?: string;

  icon?: ReactNode;
};

export default function DashboardCard({

  title,

  value,

  color = "text-violet-600",

  icon,

}: Props) {

  return (

    <div className="
      group
      bg-white
      rounded-[30px]
      border
      border-slate-200
      shadow-sm
      p-7
      hover:shadow-xl
      hover:-translate-y-1
      transition-all
      duration-300
    ">

      {/* TOP */}

      <div className="
        flex
        items-start
        justify-between
        mb-8
      ">

        {/* TITLE */}

        <div>

          <h3 className="
            text-slate-500
            text-[14px]
            font-medium
            mb-3
          ">

            {title}

          </h3>

          <p className={`
            text-5xl
            font-bold
            tracking-tight
            ${color}
          `}>

            {value}

          </p>

        </div>

        {/* ICON */}

        {icon && (

          <div className="
            w-14
            h-14
            rounded-2xl
            bg-slate-100
            flex
            items-center
            justify-center
            text-slate-700
            group-hover:scale-105
            transition-all
          ">

            {icon}

          </div>

        )}

      </div>

      {/* FOOTER */}

      <div className="
        flex
        items-center
        gap-2
        text-[12.5px]
        text-emerald-600
        font-medium
      ">

        <div className="
          w-2
          h-2
          rounded-full
          bg-emerald-500
        "></div>

        Live analytics updated

      </div>

    </div>
  );
}