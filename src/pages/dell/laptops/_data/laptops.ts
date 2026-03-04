export interface Laptop {
    id: number;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    specs: string[];
    wasPrice: string;
    nowPrice: string;
    tag: string | null;
}

export const laptops: Laptop[] = [
    {
        id: 1,
        name: "Inspiron 14 Laptop",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-14-5445-laptop-pdp-mod01.png",
        rating: 4.5,
        reviews: 1243,
        specs: [
            "Windows 11 Home",
            "Intel® Core™ i5-1235U Processor",
            "8GB DDR4 RAM",
            "512GB SSD Storage",
            '14" FHD (1920 x 1080) Display',
        ],
        wasPrice: "$729.99",
        nowPrice: "$549.99",
        tag: "Sale",
    },
    {
        id: 2,
        name: "XPS 13 Laptop",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/xps-13-9340-laptop-pdp-mod01.png",
        rating: 4.8,
        reviews: 856,
        specs: [
            "Windows 11 Home",
            "Intel® Core™ Ultra 5 Processor 125H",
            "16GB LPDDR5x RAM",
            "512GB SSD Storage",
            '13.4" FHD+ (1920 x 1200) Display',
        ],
        wasPrice: "$1,299.99",
        nowPrice: "$999.99",
        tag: "Best Seller",
    },
    {
        id: 3,
        name: "Inspiron 16 Laptop",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-16-5640-laptop-pdp-mod01.png",
        rating: 4.3,
        reviews: 621,
        specs: [
            "Windows 11 Home",
            "Intel® Core™ i7-1355U Processor",
            "16GB DDR4 RAM",
            "1TB SSD Storage",
            '16" FHD+ (1920 x 1200) Display',
        ],
        wasPrice: "$999.99",
        nowPrice: "$799.99",
        tag: null,
    },
    {
        id: 4,
        name: "Latitude 5540 Laptop",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/latitude-5540-laptop-pdp-mod01.png",
        rating: 4.6,
        reviews: 412,
        specs: [
            "Windows 11 Pro",
            "Intel® Core™ i5-1345U Processor",
            "16GB DDR4 RAM",
            "256GB SSD Storage",
            '15.6" FHD (1920 x 1080) Display',
        ],
        wasPrice: "$1,199.99",
        nowPrice: "$949.99",
        tag: null,
    },
    {
        id: 5,
        name: "Vostro 15 Laptop",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/vostro-3520-laptop-pdp-mod01.png",
        rating: 4.2,
        reviews: 334,
        specs: [
            "Windows 11 Pro",
            "Intel® Core™ i5-1235U Processor",
            "8GB DDR4 RAM",
            "512GB SSD Storage",
            '15.6" FHD (1920 x 1080) Display',
        ],
        wasPrice: "$849.99",
        nowPrice: "$649.99",
        tag: null,
    },
    {
        id: 6,
        name: "Alienware m16 Laptop",
        image: "https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-m16-r2-laptop-pdp-mod01.png",
        rating: 4.7,
        reviews: 289,
        specs: [
            "Windows 11 Home",
            "Intel® Core™ i9-14900HX Processor",
            "32GB DDR5 RAM",
            "1TB SSD Storage",
            '16" QHD+ (2560 x 1600) 240Hz Display',
        ],
        wasPrice: "$2,499.99",
        nowPrice: "$1,999.99",
        tag: "Gaming",
    },
];
