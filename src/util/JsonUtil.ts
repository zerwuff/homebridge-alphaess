export class JsonUtil
{
    static deserialize<T>(jsonObject: any, Constructor: { new(): T }): T {
        if (!Constructor || !Constructor.prototype.__propertyTypes__ || !jsonObject || typeof jsonObject !== "object") {
            // No root-type with usable type-information is available.
            return jsonObject;
        }

        // Create an instance of root-type.
        var instance: any = new Constructor();

        // For each property marked with @JsonMember, do...
        Object.keys(Constructor.prototype.__propertyTypes__).forEach(propertyKey => {
            var PropertyType = Constructor.prototype.__propertyTypes__[propertyKey];

            // Deserialize recursively, treat property type as root-type.
            instance[propertyKey] = this.deserialize(jsonObject[propertyKey], PropertyType);
        });

        return instance;
    }
}