please help me to make a progress report of Managing and tidying existing Database Vendor, since there are information that is not completed yet, and there are lots of vendors in database and we will continue implementing and upgrading what is needed to make the database clean and informative. we are on progress on several things right now, since there are currently 10308 vendors in the Database and we are setting some rules on how the the information should be shown. such as vendor's name, address rules, phone number, vendor types, legal documents information, etc. i have prepared some rules for them, and we are now in progress fixing the old vendor which had existed in the database and need time, since the database have been created long ago since 2017 and we just set the rules end of 2025. I will let know the progress weekly, please give me field to fill in and make progress report based on that. some we should edit directly on database, for example vendor's name, since it needs review before editing. so we edit one by one. some we choose exporting excel and editing those, and ask for team IT's help to inject based on Supplier Code when we done mapping or tidying the datas.

These are the lists that has been DONE since mid of 2025 until now (you may help me to give recommendation how to write in good way):
- Mapping Default Payment Term which is still blank
- Mapping Supplier Type and Requested some new types to IT Team. some of the types will affect permission/access, for example for REIMBURSE type (only purchasing admin has permission to access that in creating PO, buyers can't), ACCOUNTING type, etc
- Fixing Address based on new rules for Active Suppliers (but still need recheck for the City and Country, not done yet but not priority)
- Fixing Phone and Mobile Number based on new rules for Active Suppliers (but still need recheck, not done yet but not priority)
- Syncing vendor name between 2 Database (MJS and WSI), since there are some that should be the same vendor, but has different name between those 2 Database. since it will affect the vlookup formula when we need IT team's help to inject the information from excel to Database / system.
- Requested FLAG to team IT to differentiate and applying Flag of WSI-X to vendors on database MJS which is not existing on database WSI (this can happen, since there are different PIC of departments that created vendor on database. for example the accounting or shipment team that fully focusing on MJS, will not create vendor on WSI since they do not need it. this flag is needed since it affects the IT injection as well when needed, the vlookup will show N/A if not exist on WSI. FYI, since those 2 database we hope will sync, then we always focus on MJS and exporting the excel for editing based on rules, then we asked for IT team help to inject them back to MJS and WSI (if the vendor exist)
- Deleting internal email such as no_send@email.com, since it is not a valid information for the vendor (we will delete it directly in the future before approving, and also we had created new registration form that do not let them input that address, it will show not valid notification). so we just tidying up existing data.
- eliminate website that is written on email field, and vice versa. we have lock that as well in the future registration form.
- disable vendor that do not have any transaction with us for more than 3 years (since 2023)

Done creating new rules as guide:
- Supplier Type
- Vendor Name
- Vendor Address
- Vendor Phone and Mobile Number
- Vendor NPWP
- Vendor City, Country, Delivery Term, Currency
- Flags

In progress:
- Fixing Address based on new rules for Inactive Suppliers
- Fixing Phone and Mobile Number based on new rules for Inactive Suppliers
- Extracting NPWP Attachment with AI's Help / Document into Text information as Supplier Database (not just as attachment), but it needs to be rechecked as well, whether the extracted information is correct.
- capslocked all information on Database, so that it is tidy
- Requesting clean and tidy report of Supplier Data, including the complete information of 3 main contacts (Inquiry email and WA, Send PO/WO email and WA, Invoice checking email and WA)
- Fixing Supplier name based on new rules, it needs review based on the location, vendor's stamp or invoice, bank account holder, etc. and if there is double vendor before, we should check history and review which vendor code should be disabled before fixing the supplier name.
- Completing Bank Account Details helped by Cashier Team (since they used different ERP before)
- Mapping vendors which are related on to another, writing notes on Properties Field on database, so whenever data is exported, other departments can have those information if needed. for example REZEKI MAKMUR is for non tax, and CHAINTRACO MAKMUR, CV is for tax. for example, whenever accounting team needed those information, there will be clear information about those. but it needs time to map those information.
- Following up related buyer for those vendors that have not filled in vendor registration form (registered before 2021), since it the procedure exist around 2021 year.
- Saving PDF from existing supplier web, since we will move to new web later on (saving those PDF as backups, since the web could be error one day and can not be access anymore)
- Recheck City, State, Country whether they are correct based on address and other information (but not priority). this is needed since maybe before, we are not really focus on complete information when vendor registered, so there may be missing information there.
- Recheck existing vendor whether they are related to one another, for example if the email domains are the same although vendor's name on database are different, phone number, address, website, etc. for future solution, i have requested buyer to mandatory select whether it is totally new vendor, or it is related to old vendor, why it is different and they need to input the reason as remarks.
- Default Delivery term on WSI List is not complete, compared to MJS. it is in progress fixing by IT Team, and we will continue to map the complete Delivery term to be injected back to WSI, based on what is applied on MJS before. but first, the Main List should be complete, since although i try to apply it manually, the selection do not popup.
- New Registration for Overseas, in progress editing