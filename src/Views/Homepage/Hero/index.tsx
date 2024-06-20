import React from "react";
import { shortenString } from "@/utils";
import { Tooltip } from "@mui/material";
import Link from "next/link";
import Slider from "react-slick";

export default function Hero({ heroData = [] }: { heroData: any }) {
  const settings = {
    customPaging: function (i: number) {
      return <div className="dot h-full" />;
    },
    dots: true,
    dotsClass: "slick-dots slick-thumb",
    arrows: false,
    infinite: heroData.length > 3,
    slidesToShow: 3,
    slidesToScroll: 3,
    initialSlide: 0,
    autoplay: true,
    autoplaySpeed: 2000,
    loop: true,
    speed: 500,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: heroData.length > 2,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: heroData.length > 1,
        },
      },
    ],
  };

  return (
    <div className="pt-1">
      <Slider {...settings}>
        {heroData.length !== 0 &&
          heroData.map((el: any) => (
            <Tooltip
              key={el._id}
              title={el?.tick || el?.name}
              placement="bottom"
            >
              <div className="h-[70vh] 3xl:h-[50vh] relative group overflow-hidden bg-gradient-to-b from-transparent rounded-lg border border-white border-opacity-[0.2]">
                <div className="w-full h-full group-hover:scale-110 group-hover:brightness-50 transition-all duration-700">
                  {el.icon ? (
                    <img
                      src={el.icon}
                      alt="token icon"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gray-700 text-secondary center h-full uppercase text-xl font-bold w-full ">
                      <span>{el?.tick || el?.name}</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-transparent to-black overflow-hidden p-5 h-auto max-h-[20%] group-hover:max-h-[210px] transition-[max-height] duration-[900ms]">
                  <div className="mt-[-4px]">
                    <div className="flex justify-between">
                      <div className="font-bold text-white leading-relaxed text-[20px] pt-1 uppercase">
                        {el?.tick?.length > 15 || el?.name?.length > 15
                          ? shortenString(el?.tick || el?.name)
                          : el?.tick || el?.name}
                      </div>
                      <div className="h-fit rounded py-[4px] px-[16px] bg-bitcoin text-[14px] my-auto text-[#825600] uppercase font-bold">
                        {el?.tick ? "CBRC" : "Collection"}
                      </div>{" "}
                    </div>

                    <div className="text-bitcoin uppercase">
                      {el?.tick ? "CBRC-20" : "Collection"}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 duration-[1500ms] group-hover:duration-200">
                      <div className="my-hidden-div pt-2 text-white line-clamp-2 ">
                        {el?.description}
                      </div>
                      <div className="pt-3">
                        {el?.tick ? (
                          <Link href={`/cbrc-20/${el.tick}`} shallow>
                            <button className="w-full bg-accent h-[45px] rounded-md text-white">
                              View Token
                            </button>
                          </Link>
                        ) : (
                          <Link href={`/collection/${el.slug}`} shallow>
                            <button className="w-full bg-accent h-[45px] rounded-md text-white">
                              View Collection
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tooltip>
          ))}
      </Slider>
    </div>
  );
}
