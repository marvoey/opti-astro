export interface FeaturedDeal {
    id: number;
    name: string;
    subtitle: string;
    image: string;
    specs: string[];
    wasPrice: string;
    nowPrice: string;
}

export const featuredDeals: FeaturedDeal[] = [
    {
        id: 1,
        name: "XPS 15 Laptop",
        subtitle: "Power meets portability",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/xps-15-9530-laptop-pdp-mod01.png",
        specs: [
            "Intel® Core™ i7-13700H",
            "16GB RAM | 512GB SSD",
            '15.6" OLED Touch Display',
            "NVIDIA® GeForce RTX™ 4060",
        ],
        wasPrice: "$1,799.99",
        nowPrice: "$1,399.99",
    },
    {
        id: 2,
        name: "Inspiron 14 2-in-1",
        subtitle: "Versatile performance",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-14-5435-laptop-pdp-mod01.png",
        specs: [
            "AMD Ryzen™ 7 7730U",
            "16GB RAM | 512GB SSD",
            '14" FHD Touch Display',
            "360° Flip & Fold Design",
        ],
        wasPrice: "$899.99",
        nowPrice: "$699.99",
    },
    {
        id: 3,
        name: "Alienware x16 Laptop",
        subtitle: "Ultimate gaming power",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-x16-r2-laptop-pdp-mod01.png",
        specs: [
            "Intel® Core™ Ultra 9 Processor",
            "32GB DDR5 | 2TB SSD",
            '16" QHD+ 240Hz Display',
            "NVIDIA® GeForce RTX™ 4090",
        ],
        wasPrice: "$3,499.99",
        nowPrice: "$2,799.99",
    },
];
