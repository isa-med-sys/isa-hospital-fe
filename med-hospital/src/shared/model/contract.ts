export interface Contract {
    id: number;
    userId: number;
    companyId: number;
    startDate: Date;
    equipmentQuantities: Record<number, number>;
    isActive: boolean;
}