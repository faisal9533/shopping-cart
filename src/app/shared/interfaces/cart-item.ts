import { Product } from './product';

export interface CartItem {
    product: any;
    options: {
        name: string;
        value: string;
    }[];
    quantity: number;
    maxqty:number;
}
